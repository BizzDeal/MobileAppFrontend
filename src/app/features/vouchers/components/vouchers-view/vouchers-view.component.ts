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
  IonSpinner,
  IonModal,
  IonButtons,
  IonInfiniteScroll,
  IonInfiniteScrollContent
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
import { ToastService } from '../../../../core/services/toast.service';
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
    IonSpinner,
    IonModal,
    IonButtons,
    IonInfiniteScroll,
    IonInfiniteScrollContent
  ],
  templateUrl: './vouchers-view.component.html',
  styleUrls: ['./vouchers-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VouchersViewComponent {
  private readonly vouchersService = inject(CustomerVouchersService);
  private readonly toastService = inject(ToastService);

  readonly vouchers = this.vouchersService.vouchers;
  readonly loading = this.vouchersService.loading;
  readonly error = this.vouchersService.error;
  readonly hasMore = this.vouchersService.hasMore;

  readonly searchQuery = signal<string>('');
  readonly selectedFilter = signal<FilterStatus>('ACTIVE');
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

    // Search is now handled by backend, but we keep local filtering as a fallback 
    // in case the list still has other types of vouchers that we want to filter locally.
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

  getQrData(voucher: CustomerVoucher): string {
    return encodeURIComponent(voucher.voucher_code);
  }

  doRefresh(event: any) {
  }

  onSearchChange(event: any): void {
    const value = event.target.value;
    this.searchQuery.set(value || '');
    this.vouchersService.loadVouchers(1, 20, false, this.searchQuery()).subscribe();
  }

  setFilter(filter: FilterStatus): void {
    this.selectedFilter.set(filter);
  }

  copyVoucherCode(code: string): void {
    navigator.clipboard?.writeText(code);
    this.toastService.showSuccess(`📋 Code ${code} copied to clipboard!`);
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

  getVoucherTypeClass(v: any): string {
    const offerType = v.offer_type || v.offer?.offer_type;
    const discountType = v.discount_type || v.offer?.discount_type;
    const text = (v.discountText || '').toLowerCase();

    if (offerType === 'CASHBACK' || text.includes('cashback')) {
      return 'type-cashback';
    }
    if (discountType === 'PERCENTAGE' || text.includes('%')) {
      return 'type-percentage';
    }
    if (discountType === 'FIXED_AMOUNT' || discountType === 'FIXED' || text.includes('₹') || text.includes('off')) {
      return 'type-fixed';
    }

    return 'type-fixed'; // default fallback for colored items
  }

  loadMore(event: any) {
    const obs = this.vouchersService.loadMoreVouchers(this.searchQuery());
    if (obs) {
      obs.subscribe({
        next: () => event.target.complete(),
        error: () => event.target.complete()
      });
    } else {
      event.target.complete();
    }
  }
}
