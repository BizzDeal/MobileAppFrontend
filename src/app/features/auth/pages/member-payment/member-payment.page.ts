import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline,
  cloudUploadOutline,
  copyOutline,
  documentTextOutline,
  alertCircleOutline,
} from 'ionicons/icons';
import { MemberPaymentService } from './member-payment.service';
@Component({
  selector: 'app-member-payment',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonSpinner,
  ],
  providers: [MemberPaymentService],
  templateUrl: './member-payment.page.html',
  styleUrl: './member-payment.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberPaymentPage {
  readonly payService = inject(MemberPaymentService);

  constructor() {
    addIcons({
      'document-text-outline': documentTextOutline,
      'cloud-upload-outline': cloudUploadOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'copy-outline': copyOutline,
      'alert-circle-outline': alertCircleOutline,
    });
  }

  ionViewWillEnter(): void {
    this.payService.loadSettings();
  }
}
