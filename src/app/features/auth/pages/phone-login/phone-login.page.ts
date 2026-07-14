import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonModal } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  briefcaseOutline,
  chatboxEllipsesOutline,
  giftOutline,
  gitNetworkOutline,
  keypadOutline,
  logInOutline,
  peopleOutline,
  phonePortraitOutline,
} from 'ionicons/icons';
import { PhoneLoginService } from './phone-login.service';
import { AuthSessionService } from '../../../../core/services/auth-session.service';
import { UserRole } from '../../models/auth.model';

@Component({
  selector: 'app-phone-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonContent, IonIcon, IonModal],
  providers: [PhoneLoginService],
  templateUrl: './phone-login.page.html',
  styleUrl: './phone-login.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhoneLoginPage implements OnInit {
  readonly authService = inject(PhoneLoginService);
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);

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

  ngOnInit(): void {
    if (this.authSession.isAuthenticated()) {
      const role = this.authSession.userRole();
      if (role === UserRole.ADMIN) {
        this.router.navigate(['/admin'], { replaceUrl: true });
      } else {
        this.router.navigate(['/home'], { replaceUrl: true });
      }
    }
  }
}
