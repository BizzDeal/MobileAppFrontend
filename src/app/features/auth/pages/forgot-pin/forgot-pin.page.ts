import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  phonePortraitOutline,
  keypadOutline,
  lockClosedOutline,
  checkmarkCircleOutline,
  refreshOutline,
  arrowBackOutline,
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
    });
  }
}
