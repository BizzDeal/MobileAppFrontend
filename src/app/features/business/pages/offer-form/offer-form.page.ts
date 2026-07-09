import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonInput, IonTextarea, IonSelect, IonSelectOption, IonIcon, IonDatetime, IonDatetimeButton, IonModal } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { imageOutline, saveOutline, arrowBackOutline, calendarOutline, pricetagOutline, documentTextOutline, optionsOutline, cashOutline, calculatorOutline } from 'ionicons/icons';
import { MemberDashboardService } from '../../../home/services/member-dashboard.service';

@Component({
  selector: 'app-offer-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonInput, IonTextarea, IonSelect, IonSelectOption, IonIcon, IonDatetime, IonDatetimeButton, IonModal
  ],
  templateUrl: './offer-form.page.html',
  styleUrls: ['./offer-form.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OfferFormPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dashboardService = inject(MemberDashboardService);

  readonly isEditMode = signal(false);
  readonly offerId = signal<string | null>(null);
  readonly selectedImageName = signal<string | null>(null);

  offerForm: FormGroup;

  constructor() {
    addIcons({ imageOutline, saveOutline, arrowBackOutline, calendarOutline, pricetagOutline, documentTextOutline, optionsOutline, cashOutline, calculatorOutline });
    
    this.offerForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      offer_type: ['', Validators.required],
      discount_value: [null, [Validators.required, Validators.min(0)]],
      discount_type: [null, Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
    }, { validators: this.dateValidator });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.offerId.set(id);
      this.loadOfferDetails(id);
    }
  }

  loadOfferDetails(id: string) {
    const data = this.dashboardService.dashboardData();
    if (data?.myOffers) {
      const offer = data.myOffers.find(o => o.id === id);
      if (offer) {
        this.offerForm.patchValue({
          title: offer.title,
          description: offer.description,
          offer_type: offer.offer_type,
          discount_value: offer.discount_value,
          discount_type: offer.discount_type,
          start_date: offer.start_date,
          end_date: offer.end_date,
        });
      }
    }
  }

  dateValidator(group: FormGroup) {
    const start = group.get('start_date')?.value;
    const end = group.get('end_date')?.value;
    if (start && end && new Date(end) < new Date(start)) {
      return { dateMismatch: true };
    }
    return null;
  }

  onImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedImageName.set(file.name);
    }
  }

  onStartDateChange(event: CustomEvent): void {
    const value = event.detail.value as string;
    if (value) {
      this.offerForm.get('start_date')?.setValue(value);
      this.offerForm.get('start_date')?.markAsDirty();
    }
  }

  onEndDateChange(event: CustomEvent): void {
    const value = event.detail.value as string;
    if (value) {
      this.offerForm.get('end_date')?.setValue(value);
      this.offerForm.get('end_date')?.markAsDirty();
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.offerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit() {
    if (this.offerForm.invalid) {
      this.offerForm.markAllAsTouched();
      return;
    }
    
    console.log('Form Submitted', this.offerForm.value);
    this.router.navigate(['/home']);
  }
}
