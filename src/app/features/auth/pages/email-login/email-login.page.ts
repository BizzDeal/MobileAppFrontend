import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonModal, IonSpinner } from '@ionic/angular/standalone';
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
  mailOutline,
} from 'ionicons/icons';
import { EmailLoginService } from './email-login.service';
import { AuthSessionService } from '../../../../core/services/auth-session.service';
import { UserRole } from '../../models/auth.model';
import { AnimatedBackgroundComponent } from '../../../../shared/components/animated-background/animated-background.component';

@Component({
  selector: 'app-email-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonContent, IonIcon, IonModal, IonSpinner, AnimatedBackgroundComponent],
  providers: [EmailLoginService],
  templateUrl: './email-login.page.html',
  styleUrl: './email-login.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailLoginPage implements OnInit {
  readonly authService = inject(EmailLoginService);
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
      'mail-outline': mailOutline,
    });
  }

  ngOnInit(): void {
    if (this.authSession.isAuthenticated()) {
      const role = this.authSession.userRole();
      if (role === UserRole.ADMIN) {
        this.router.navigate(['/admin'], { replaceUrl: true }).catch(() => {});
      } else {
        this.router.navigate(['/home'], { replaceUrl: true }).catch(() => {});
      }
    }
  }
}
