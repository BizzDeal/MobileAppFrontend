import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonIcon, IonModal } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  phonePortraitOutline,
  chatboxEllipsesOutline,
  keypadOutline,
  logInOutline,
  peopleOutline,
  gitNetworkOutline,
  giftOutline,
  briefcaseOutline,
} from 'ionicons/icons';
import { PhoneLoginService } from './phone-login.service';

@Component({
  selector: 'app-phone-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonContent, IonIcon, IonModal],
  providers: [PhoneLoginService],
  templateUrl: './phone-login.page.html',
  styleUrl: './phone-login.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhoneLoginPage {
  readonly authService = inject(PhoneLoginService);

  constructor() {
    addIcons({
      'phone-portrait-outline': phonePortraitOutline,
      'chatbox-ellipses-outline': chatboxEllipsesOutline,
      'keypad-outline': keypadOutline,
      'log-in-outline': logInOutline,
      'people-outline': peopleOutline,
      'git-network-outline': gitNetworkOutline,
      'gift-outline': giftOutline,
      'briefcase-outline': briefcaseOutline,
    });
  }
}
