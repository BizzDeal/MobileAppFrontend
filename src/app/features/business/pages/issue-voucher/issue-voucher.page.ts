import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { VouchersService } from '../../services/vouchers.service';
import { MemberDashboardService } from '../../../home/services/member-dashboard.service';
import { addIcons } from 'ionicons';
import { arrowBackOutline, caretDownOutline, checkmarkCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-issue-voucher',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './issue-voucher.page.html',
  styleUrls: ['./issue-voucher.page.scss']
})
export class IssueVoucherPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly vouchersService = inject(VouchersService);
  private readonly dashboardService = inject(MemberDashboardService);

  issueForm!: FormGroup;
  isSubmitting = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  // We read the member's existing loaded offers
  readonly dashboardData = this.dashboardService.dashboardData;

  constructor() {
    addIcons({ arrowBackOutline, caretDownOutline, checkmarkCircleOutline });
  }

  ngOnInit() {
    this.issueForm = this.fb.group({
      offer_id: ['', [Validators.required]],
      customer_phone: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  get f() {
    return this.issueForm.controls;
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

    const payload = this.issueForm.value;

    this.vouchersService.issueVoucher(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.successMessage = 'Voucher issued successfully!';
        this.issueForm.reset();
        
        // Go back after short delay
        setTimeout(() => {
          this.goBack();
        }, 2000);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err?.error?.message || err?.message || 'Failed to issue voucher';
      }
    });
  }
}
