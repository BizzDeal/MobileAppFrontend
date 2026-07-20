import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  checkmarkCircleOutline,
  keypadOutline,
  lockClosedOutline,
  phonePortraitOutline,
  refreshOutline,
  mailOutline,
} from 'ionicons/icons';
import { ForgotPinService } from './forgot-pin.service';

@Component({
  selector: 'app-forgot-pin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonIcon,
  ],
  providers: [ForgotPinService],
  templateUrl: './forgot-pin.page.html',
  styleUrl: './forgot-pin.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPinPage {
  readonly forgotService = inject(ForgotPinService);

  constructor() {
    addIcons({
      'phone-portrait-outline': phonePortraitOutline,
      'keypad-outline': keypadOutline,
      'lock-closed-outline': lockClosedOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'refresh-outline': refreshOutline,
      'arrow-back-outline': arrowBackOutline,
      'mail-outline': mailOutline,
    });
  }
}
