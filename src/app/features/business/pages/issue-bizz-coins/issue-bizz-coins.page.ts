import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';
import { VouchersService } from '../../services/vouchers.service';
import { environment } from '../../../../../environments/environment';
import { extractFriendlyErrorMessage } from '../../../../core/utils/error.utils';
import { getInitials, getAvatarColor } from '../../../../shared/utils/avatar.util';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  checkmarkCircleOutline,
  mailOutline,
  callOutline,
  alertCircleOutline,
  personOutline
} from 'ionicons/icons';

export interface CustomerLookupResult {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  profile_pic_url: string | null;
}

@Component({
  selector: 'app-issue-bizz-coins',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, CachedImgDirective],
  templateUrl: './issue-bizz-coins.page.html',
  styleUrls: ['./issue-bizz-coins.page.scss']
})
export class IssueBizzCoinsPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly vouchersService = inject(VouchersService);

  readonly getInitials = getInitials;
  readonly getAvatarColor = getAvatarColor;

  issueForm!: FormGroup;
  isSubmitting = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  bizzCoinOfferId: string | null = null;

  // Customer Lookup states
  isSearchingCustomer = false;
  customerNotFound = false;
  searchedCustomer: CustomerLookupResult | null = null;
  avatarLoadError = false;

  constructor() {
    addIcons({
      arrowBackOutline,
      checkmarkCircleOutline,
      mailOutline,
      callOutline,
      alertCircleOutline,
      personOutline
    });
  }

  ngOnInit() {
    this.issueForm = this.fb.group({
      coins: ['', [Validators.required, Validators.min(1)]],
      customer_phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]]
    });

    // Listen to phone number changes for customer lookup
    this.issueForm.get('customer_phone')?.valueChanges.subscribe(val => {
      const cleanPhone = (val || '').toString().trim().replace(/\D/g, '');
      if (cleanPhone.length === 10) {
        this.lookupCustomer(cleanPhone);
      } else {
        this.searchedCustomer = null;
        this.customerNotFound = false;
        this.isSearchingCustomer = false;
      }
    });

    // Retrieve active member Bizz Coin offer ID behind the scenes
    this.http.get<any>(`${environment.apiUrl}/offers/bizz-coins/my`).subscribe({
      next: (res) => {
        if (res && res.id) {
          this.bizzCoinOfferId = res.id;
        }
      },
      error: () => {
        this.bizzCoinOfferId = null;
      }
    });
  }

  get f() {
    return this.issueForm.controls;
  }

  private lookupCustomer(phone: string) {
    this.isSearchingCustomer = true;
    this.customerNotFound = false;
    this.searchedCustomer = null;
    this.avatarLoadError = false;

    this.http.get<any>(`${environment.apiUrl}/users/by-phone/${phone}`).subscribe({
      next: (res) => {
        this.isSearchingCustomer = false;
        if (res && res.name) {
          this.searchedCustomer = {
            id: res.id,
            name: res.name,
            email: res.email,
            phone: res.phone,
            profile_pic_url: res.profile_pic_url
          };
        } else {
          this.customerNotFound = true;
        }
      },
      error: () => {
        this.isSearchingCustomer = false;
        this.customerNotFound = true;
        this.searchedCustomer = null;
      }
    });
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  onSubmit() {
    if (this.issueForm.invalid) {
      this.issueForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.successMessage = null;

    const val = this.issueForm.value;
    const payload = {
      customer_phone: val.customer_phone,
      coins: Number(val.coins)
    };

    this.http.post<any>(`${environment.apiUrl}/bizz-coins/issue`, payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        const targetName = this.searchedCustomer?.name ? ` (${this.searchedCustomer.name})` : '';
        this.successMessage = res?.message || `${val.coins} Bizz Coins issued successfully to customer${targetName}!`;
        this.issueForm.reset();
        this.searchedCustomer = null;
        this.customerNotFound = false;
        
        setTimeout(() => {
          this.goBack();
        }, 2000);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = extractFriendlyErrorMessage(err, 'Failed to issue Bizz Coins.');
      }
    });
  }
}
