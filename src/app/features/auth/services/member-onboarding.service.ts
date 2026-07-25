import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { AuthResponse } from '../models/auth.model';
import { SHOW_SUCCESS_TOAST } from '../../../core/interceptors/interceptor.tokens';
import { extractFriendlyErrorMessage } from '../../../core/utils/error.utils';

export interface BusinessCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active?: boolean;
}

export interface PaymentSettings {
  id: number;
  upi_id: string;
  account_name: string;
  registration_fee: number;
  currency: string;
  card_title: string;
  card_subtitle: string;
  benefits: string;
}

export interface LocationState {
  id: string;
  name: string;
  lgdCode?: string;
}

export interface LocationDistrict {
  id: string;
  name: string;
  stateId?: string;
  lgdCode?: string;
}

export interface MemberRegistrationPayload {
  full_name: string;
  phone: string;
  pin: string;
  whatsapp: string;
  email: string;
  address: string;
  state_id: string;
  district_id: string;
  business_name: string;
  category_id: string;
  business_description: string;
  website: string;
  gst_number: string;
  business_address?: string;
  business_state_id?: string;
  business_district_id?: string;
  reference_code?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MemberOnboardingService {
  private readonly http = inject(HttpClient);
  private readonly authSession = inject(AuthSessionService);
  private readonly apiUrl = environment.apiUrl;

  readonly categories = signal<BusinessCategory[]>([]);
  readonly isLoadingCategories = signal<boolean>(false);
  readonly categoriesError = signal<string | null>(null);

  readonly states = signal<LocationState[]>([]);
  readonly isLoadingStates = signal<boolean>(false);
  readonly statesError = signal<string | null>(null);

  readonly districts = signal<LocationDistrict[]>([]);
  readonly isLoadingDistricts = signal<boolean>(false);
  readonly districtsError = signal<string | null>(null);

  readonly businessDistricts = signal<LocationDistrict[]>([]);
  readonly isLoadingBusinessDistricts = signal<boolean>(false);
  readonly businessDistrictsError = signal<string | null>(null);

  readonly paymentSettings = signal<PaymentSettings | null>(null);
  readonly isLoadingPaymentSettings = signal<boolean>(false);
  readonly paymentSettingsError = signal<string | null>(null);

  readonly registrationData = signal<MemberRegistrationPayload | null>(null);
  readonly profilePicFile = signal<File | null>(null);
  readonly businessLogoFile = signal<File | null>(null);
  readonly paymentReceiptFile = signal<File | null>(null);
  readonly isSubmitting = signal<boolean>(false);

  async fetchCategories(): Promise<void> {
    if (this.categories().length > 0) return;
    this.isLoadingCategories.set(true);
    this.categoriesError.set(null);
    try {
      const res = await firstValueFrom(
        this.http.get<any>(`${this.apiUrl}/businesses/categories`)
      );
      const list: BusinessCategory[] = Array.isArray(res) ? res : res?.data || res?.items || [];
      const activeList = list.filter((cat) => cat.is_active !== false);
      this.categories.set(activeList);
    } catch (err: any) {
      console.error('Failed to fetch categories from BE:', err);
      this.categoriesError.set(extractFriendlyErrorMessage(err, 'Failed to fetch business categories from server.'));
      throw err;
    } finally {
      this.isLoadingCategories.set(false);
    }
  }

  async fetchStates(): Promise<void> {
    if (this.states().length > 0) return;
    this.isLoadingStates.set(true);
    this.statesError.set(null);
    try {
      const res = await firstValueFrom(
        this.http.get<any>(`${this.apiUrl}/locations/states`)
      );
      const list: LocationState[] = Array.isArray(res) ? res : res?.data || res?.items || [];
      this.states.set(list);
    } catch (err: any) {
      console.error('Failed to fetch states from BE:', err);
      this.statesError.set(extractFriendlyErrorMessage(err, 'Failed to fetch states from server.'));
      throw err;
    } finally {
      this.isLoadingStates.set(false);
    }
  }

  async fetchDistrictsByState(stateId: string): Promise<void> {
    if (!stateId) {
      this.districts.set([]);
      return;
    }
    this.isLoadingDistricts.set(true);
    this.districtsError.set(null);
    try {
      const res = await firstValueFrom(
        this.http.get<any>(`${this.apiUrl}/locations/states/${stateId}/districts`)
      );
      const list: LocationDistrict[] = Array.isArray(res) ? res : res?.data || res?.items || [];
      this.districts.set(list);
    } catch (err: any) {
      console.error('Failed to fetch districts from BE:', err);
      this.districtsError.set(extractFriendlyErrorMessage(err, 'Failed to fetch districts from server.'));
      throw err;
    } finally {
      this.isLoadingDistricts.set(false);
    }
  }

  async fetchBusinessDistrictsByState(stateId: string): Promise<void> {
    if (!stateId) {
      this.businessDistricts.set([]);
      return;
    }
    this.isLoadingBusinessDistricts.set(true);
    this.businessDistrictsError.set(null);
    try {
      const res = await firstValueFrom(
        this.http.get<any>(`${this.apiUrl}/locations/states/${stateId}/districts`)
      );
      const list: LocationDistrict[] = Array.isArray(res) ? res : res?.data || res?.items || [];
      this.businessDistricts.set(list);
    } catch (err: any) {
      console.error('Failed to fetch business districts from BE:', err);
      this.businessDistrictsError.set(extractFriendlyErrorMessage(err, 'Failed to fetch business districts from server.'));
      throw err;
    } finally {
      this.isLoadingBusinessDistricts.set(false);
    }
  }

  setRegistrationData(data: MemberRegistrationPayload, profilePic?: File | null, businessLogo?: File | null): void {
    this.registrationData.set(data);
    if (profilePic !== undefined) {
      this.profilePicFile.set(profilePic || null);
    }
    if (businessLogo !== undefined) {
      this.businessLogoFile.set(businessLogo || null);
    }
  }

  setPaymentReceipt(receipt: File | null): void {
    this.paymentReceiptFile.set(receipt);
  }

  async submitMemberRegistration(paymentReceipt?: File): Promise<AuthResponse> {
    const data = this.registrationData();
    if (!data) {
      throw new Error('Registration data is missing. Please complete the registration form.');
    }

    const receipt = paymentReceipt || this.paymentReceiptFile();
    // Payment receipt is optional
    // if (!receipt) {
    //   throw new Error('Payment receipt is missing. Please upload your payment screenshot.');
    // }

    this.isSubmitting.set(true);
    try {
      const formData = new FormData();
      formData.append('full_name', data.full_name);
      formData.append('phone', data.phone);
      formData.append('pin', data.pin);
      formData.append('whatsapp', data.whatsapp);
      formData.append('email', data.email);
      formData.append('address', data.address);
      formData.append('state_id', data.state_id);
      formData.append('district_id', data.district_id);
      formData.append('business_name', data.business_name);
      formData.append('category_id', data.category_id);
      formData.append('business_description', data.business_description);
      formData.append('website', data.website);
      formData.append('gst_number', data.gst_number);
      if (data.business_address) formData.append('business_address', data.business_address);
      if (data.business_state_id) formData.append('business_state_id', data.business_state_id);
      if (data.business_district_id) formData.append('business_district_id', data.business_district_id);
      if (data.reference_code) {
        formData.append('reference_code', data.reference_code);
      }

      const profilePic = this.profilePicFile();
      if (profilePic) {
        formData.append('profile_pic', profilePic, profilePic.name);
      }
      const businessLogo = this.businessLogoFile();
      if (businessLogo) {
        formData.append('business_logo', businessLogo, businessLogo.name);
      }
      if (receipt) {
        formData.append('payment_receipt', receipt, receipt.name);
      }

      const res: any = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.apiUrl}/auth/register-member`, formData, { context: new HttpContext().set(SHOW_SUCCESS_TOAST, true) })
      );

      if (res && res.accessToken) {
        await this.authSession.setSession(res.accessToken, res.refreshToken, res.user);
      }
      return res;
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async fetchPaymentSettings(): Promise<void> {
    this.isLoadingPaymentSettings.set(true);
    this.paymentSettingsError.set(null);
    try {
      const res = await firstValueFrom(
        this.http.get<any>(`${this.apiUrl}/payment-settings`)
      );
      const data = res?.data !== undefined ? res.data : res;
      this.paymentSettings.set(data);
    } catch (err: any) {
      console.error('Failed to fetch payment settings from BE:', err);
      this.paymentSettingsError.set(extractFriendlyErrorMessage(err, 'Failed to fetch payment settings from server.'));
      throw err;
    } finally {
      this.isLoadingPaymentSettings.set(false);
    }
  }

  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await firstValueFrom(
        this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/auth/verify-email`, { token }, { context: new HttpContext().set(SHOW_SUCCESS_TOAST, true) })
      );
      return res;
    } catch (err: any) {
      console.error('Failed to verify email:', err);
      throw new Error(extractFriendlyErrorMessage(err, 'Email verification failed.'));
    }
  }
}
