import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonSpinner,
  IonIcon,
  IonFab,
  IonFabButton,
  IonModal,
  IonButtons,
  IonButton,
  IonSearchbar,
  IonCheckbox,
  IonList,
  IonItem,
  IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add,
  peopleOutline,
  walletOutline,
  giftOutline,
  timeOutline,
  checkmarkCircleOutline,
  closeOutline,
  alertCircleOutline,
  closeCircleOutline
} from 'ionicons/icons';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { ReferralsService } from '../../services/referrals.service';
import { ProfileService } from '../../../profile/services/profile.service';
import { ReferralDTO, ReferralStatus } from '../../models/referral.model';
import { ToastService } from '../../../../core/services/toast.service';

const Contacts = registerPlugin<any>('Contacts');

@Component({
  selector: 'app-referrals-page',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonSpinner,
    IonIcon,
    IonFab,
    IonFabButton,
    IonModal,
    IonButtons,
    IonButton,
    IonSearchbar,
    IonCheckbox,
    IonList,
    IonItem,
    IonLabel
  ],
  templateUrl: './referrals-page.component.html',
  styleUrl: './referrals-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReferralsPageComponent implements OnInit {
  private readonly referralsService = inject(ReferralsService);
  private readonly profileService = inject(ProfileService);
  private readonly toastService = inject(ToastService);

  readonly referrals = signal<ReferralDTO[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly submitting = signal<boolean>(false);
  readonly isModalOpen = signal<boolean>(false);

  // Contacts list variables
  readonly contactsList = signal<{ name: string; phone: string; selected: boolean }[]>([]);
  readonly searchInput = signal<string>('');
  readonly isContactsLoading = signal<boolean>(false);
  readonly permissionDenied = signal<boolean>(false);

  // Derived Analytics using computed signals
  readonly totalReferrals = computed(() => this.referrals().length);
  readonly joinedReferrals = computed(() => 
    this.referrals().filter(r => r.status === 'JOINED').length
  );
  readonly pendingReferrals = computed(() => 
    this.referrals().filter(r => r.status === 'PENDING').length
  );

  // Computed state for contacts
  readonly filteredContacts = computed(() => {
    const query = this.searchInput().toLowerCase().trim();
    const list = this.contactsList();
    if (!query) return list;
    return list.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.phone.includes(query)
    );
  });

  readonly selectedCount = computed(() => 
    this.contactsList().filter(c => c.selected).length
  );

  readonly allSelected = computed(() => {
    const list = this.filteredContacts();
    return list.length > 0 && list.every(c => c.selected);
  });

  constructor() {
    addIcons({
      add,
      peopleOutline,
      walletOutline,
      giftOutline,
      timeOutline,
      checkmarkCircleOutline,
      closeOutline,
      alertCircleOutline,
      closeCircleOutline
    });
  }

  ngOnInit(): void {
    this.fetchReferrals();
  }

  fetchReferrals(): void {
    this.loading.set(true);
    this.error.set(null);
    this.referralsService.findAll().subscribe({
      next: (data) => {
        this.referrals.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message || 'Failed to retrieve referrals list');
        this.loading.set(false);
      }
    });
  }

  openModal(): void {
    if (this.profileService.profile()?.status === 'PENDING') {
      this.toastService.showError('Pending members cannot create referrals');
      return;
    }
    this.searchInput.set('');
    this.contactsList.set([]);
    this.isModalOpen.set(true);
    this.loadContacts();
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  async loadContacts(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Contacts plugin is only available on native platforms.');
      this.permissionDenied.set(true);
      return;
    }

    this.isContactsLoading.set(true);
    this.error.set(null);
    this.permissionDenied.set(false);

    try {
      const result = await Contacts.getContacts();
      const rawContacts: { name: string; phone: string }[] = result.contacts || [];

      if (rawContacts.length === 0) {
        this.contactsList.set([]);
        this.isContactsLoading.set(false);
        return;
      }

      // Filter and query backend for unregistered/unreferred contacts
      const uniquePhones = Array.from(new Set(rawContacts.map(c => c.phone)));
      this.referralsService.checkContacts(uniquePhones).subscribe({
        next: (eligiblePhones) => {
          const eligibleSet = new Set(eligiblePhones);
          
          // Map to unique contact by normalized phone number to remove duplicates
          const uniqueContactsMap = new Map<string, { name: string; phone: string }>();
          for (const c of rawContacts) {
            if (eligibleSet.has(c.phone)) {
              // Normalize phone to last 10 digits to deduplicate robustly across different formats (+91, spaces, dashes)
              const cleanPhone = c.phone.replace(/\D/g, '').slice(-10);
              
              if (cleanPhone && !uniqueContactsMap.has(cleanPhone)) {
                uniqueContactsMap.set(cleanPhone, c);
              }
            }
          }
          
          const filtered = Array.from(uniqueContactsMap.values()).map(c => ({
            name: c.name,
            phone: c.phone,
            selected: false
          }));

          filtered.sort((a, b) => a.name.localeCompare(b.name));
          this.contactsList.set(filtered);
          this.isContactsLoading.set(false);
        },
        error: (err) => {
          this.error.set(err?.message || 'Failed to check contacts eligibility with backend.');
          this.isContactsLoading.set(false);
        }
      });
    } catch (err: any) {
      console.error('Error fetching contacts:', err);
      this.permissionDenied.set(true);
      this.isContactsLoading.set(false);
    }
  }

  setContactSelection(phone: string, selected: boolean): void {
    this.contactsList.update(list => 
      list.map(c => c.phone === phone ? { ...c, selected } : c)
    );
  }

  toggleSelectAll(event: any): void {
    const checked = event.detail.checked;
    const filteredPhones = new Set(this.filteredContacts().map(c => c.phone));
    this.contactsList.update(list => 
      list.map(c => filteredPhones.has(c.phone) ? { ...c, selected: checked } : c)
    );
  }

  onSearchChange(event: any): void {
    this.searchInput.set(event.detail.value || '');
  }

  submitReferral(): void {
    const selected = this.contactsList().filter(c => c.selected);
    if (selected.length === 0 || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    // Generate referral code based on referrer's profile name and phone last 4 digits
    const profile = this.profileService.profile();
    const cleanName = profile?.full_name
      ? profile.full_name.trim().replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5)
      : 'BIZZ';
    const lastDigits = profile?.phone 
      ? profile.phone.replace(/\D/g, '').slice(-4) 
      : '9999';
    const generatedCode = `BD-${cleanName}-${lastDigits}`;

    const selectedPhones = selected.map(c => c.phone);

    this.referralsService.bulkCreate(selectedPhones, generatedCode).subscribe({
      next: () => {
        this.sendNativeSMS(selectedPhones, generatedCode);
        this.fetchReferrals();
        this.submitting.set(false);
        this.closeModal();
      },
      error: (err) => {
        this.error.set(err?.message || 'Failed to create referrals on the server.');
        this.submitting.set(false);
      }
    });
  }

  sendNativeSMS(phones: string[], code: string): void {
    const smsBody = `Hi! I invite you to join BizzDeal. Use my referral code ${code} to sign up!`;
    const separator = Capacitor.getPlatform() === 'ios' ? ';' : ',';
    const phonesStr = phones.join(separator);
    const smsUrl = `sms:${phonesStr}?body=${encodeURIComponent(smsBody)}`;
    
    try {
      window.open(smsUrl, '_system');
    } catch (e) {
      console.error('Failed to open SMS app:', e);
      window.location.href = smsUrl;
    }
  }

  getStatusBadgeClass(status: ReferralStatus): string {
    switch (status) {
      case 'REWARDED': return 'status-rewarded';
      case 'JOINED': return 'status-joined';
      case 'CANCELLED': return 'status-cancelled';
      default: return 'status-pending';
    }
  }

  getStatusLabel(status: ReferralStatus): string {
    switch (status) {
      case 'REWARDED': return 'Rewarded';
      case 'JOINED': return 'Joined';
      case 'CANCELLED': return 'Cancelled';
      default: return 'Invited';
    }
  }

  getStatusIcon(status: ReferralStatus): string {
    switch (status) {
      case 'REWARDED': return 'checkmark-circle-outline';
      case 'JOINED': return 'people-outline';
      case 'CANCELLED': return 'close-circle-outline';
      default: return 'time-outline';
    }
  }
}
