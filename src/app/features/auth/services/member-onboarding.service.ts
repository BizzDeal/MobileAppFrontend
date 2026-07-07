import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface BusinessCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active?: boolean;
}

export interface MemberRegistrationPayload {
  full_name: string;
  phone: string;
  pin: string;
  whatsapp: string;
  email: string;
  address: string;
  business_name: string;
  category_id: string;
  business_description: string;
  website: string;
  gst_number: string;
  firebaseToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class MemberOnboardingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  readonly categories = signal<BusinessCategory[]>([]);
  readonly isLoadingCategories = signal<boolean>(false);
  readonly categoriesError = signal<string | null>(null);

  readonly registrationData = signal<MemberRegistrationPayload | null>(null);
  readonly profilePicFile = signal<File | null>(null);
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
      this.categoriesError.set(err.message || 'Failed to fetch business categories from server.');
      throw err;
    } finally {
      this.isLoadingCategories.set(false);
    }
  }

  setRegistrationData(data: MemberRegistrationPayload, profilePic?: File | null): void {
    this.registrationData.set(data);
    if (profilePic !== undefined) {
      this.profilePicFile.set(profilePic || null);
    }
  }

  setPaymentReceipt(receipt: File | null): void {
    this.paymentReceiptFile.set(receipt);
  }

  async submitMemberRegistration(paymentReceipt?: File): Promise<any> {
    const data = this.registrationData();
    if (!data) {
      throw new Error('Registration data is missing. Please complete the registration form.');
    }

    const receipt = paymentReceipt || this.paymentReceiptFile();
    if (!receipt) {
      throw new Error('Payment receipt is missing. Please upload your payment screenshot.');
    }

    this.isSubmitting.set(true);
    try {
      const formData = new FormData();
      formData.append('full_name', data.full_name);
      formData.append('phone', data.phone);
      formData.append('pin', data.pin);
      formData.append('whatsapp', data.whatsapp);
      formData.append('email', data.email);
      formData.append('address', data.address);
      formData.append('business_name', data.business_name);
      formData.append('category_id', data.category_id);
      formData.append('business_description', data.business_description);
      formData.append('website', data.website);
      formData.append('gst_number', data.gst_number);
      formData.append('firebaseToken', data.firebaseToken || 'mock_firebase_token_for_dev');

      const profilePic = this.profilePicFile();
      if (profilePic) {
        formData.append('profile_pic', profilePic, profilePic.name);
      }
      formData.append('payment_receipt', receipt, receipt.name);

      const res = await firstValueFrom(
        this.http.post<any>(`${this.apiUrl}/auth/register-member`, formData)
      );
      return res;
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
