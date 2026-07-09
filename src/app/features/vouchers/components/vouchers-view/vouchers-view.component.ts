import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonIcon,
  IonButton,
  IonToast,
  IonSpinner,
  IonModal,
  IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  searchOutline,
  ticketOutline,
  copyOutline,
  timeOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  alertCircleOutline,
  banOutline,
  qrCodeOutline,
  closeOutline,
  scanOutline
} from 'ionicons/icons';
import { CustomerVouchersService } from '../../services/customer-vouchers.service';
import { CustomerVoucher, VoucherStatus } from '../../models/voucher.model';

type FilterStatus = 'ALL' | 'ACTIVE' | 'REDEEMED' | 'EXPIRED';

@Component({
  selector: 'app-vouchers-view',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonInput,
    IonIcon,
    IonButton,
    IonToast,
    IonSpinner,
    IonModal,
    IonButtons
  ],
  templateUrl: './vouchers-view.component.html',
  styleUrls: ['./vouchers-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VouchersViewComponent {
  private readonly vouchersService = inject(CustomerVouchersService);

  readonly vouchers = this.vouchersService.vouchers;
  readonly loading = this.vouchersService.loading;
  readonly error = this.vouchersService.error;

  readonly searchQuery = signal<string>('');
  readonly selectedFilter = signal<FilterStatus>('ALL');
  readonly toastMessage = signal<string | null>(null);
  readonly selectedQrVoucher = signal<CustomerVoucher | null>(null);

  readonly filteredVouchers = computed(() => {
    const list = this.vouchers();
    const query = this.searchQuery().toLowerCase().trim();
    const filter = this.selectedFilter();

    let result = list;

    // Apply Filter Seggregation
    if (filter === 'ACTIVE') {
      result = result.filter(v => v.status === 'ISSUED');
    } else if (filter === 'REDEEMED') {
      result = result.filter(v => v.status === 'REDEEMED');
    } else if (filter === 'EXPIRED') {
      result = result.filter(v => v.status === 'EXPIRED' || v.status === 'CANCELLED');
    }

    // Apply Search Query
    if (query) {
      result = result.filter(v =>
        v.offerTitle.toLowerCase().includes(query) ||
        v.businessName.toLowerCase().includes(query) ||
        v.voucher_code.toLowerCase().includes(query)
      );
    }

    return result;
  });

  constructor() {
    addIcons({
      searchOutline,
      ticketOutline,
      copyOutline,
      timeOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      alertCircleOutline,
      banOutline,
      qrCodeOutline,
      closeOutline,
      scanOutline
    });
  }

  onSearchChange(event: any): void {
    const value = event.target.value;
    this.searchQuery.set(value || '');
  }

  setFilter(filter: FilterStatus): void {
    this.selectedFilter.set(filter);
  }

  copyVoucherCode(code: string): void {
    navigator.clipboard?.writeText(code);
    this.toastMessage.set(`📋 Code ${code} copied to clipboard!`);
  }

  retryLoad(): void {
    this.vouchersService.loadVouchers().subscribe();
  }

  getStatusIcon(status: VoucherStatus): string {
    switch (status) {
      case 'ISSUED': return 'ticket-outline';
      case 'REDEEMED': return 'checkmark-circle-outline';
      case 'EXPIRED': return 'alert-circle-outline';
      case 'CANCELLED': return 'ban-outline';
    }
  }

  getStatusLabel(status: VoucherStatus): string {
    switch (status) {
      case 'ISSUED': return 'Active';
      case 'REDEEMED': return 'Redeemed';
      case 'EXPIRED': return 'Expired';
      case 'CANCELLED': return 'Cancelled';
    }
  }

  openQrModal(voucher: CustomerVoucher): void {
    this.selectedQrVoucher.set(voucher);
  }

  closeQrModal(): void {
    this.selectedQrVoucher.set(null);
  }

  encodeUri(val: string): string {
    return encodeURIComponent(val);
  }
}
