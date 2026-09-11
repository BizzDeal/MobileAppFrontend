import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircle,
  closeCircle,
  timeOutline,
  shieldCheckmarkOutline,
  logOutOutline,
  alertCircleOutline
} from 'ionicons/icons';
import { AuthSessionService } from '../../../../core/services/auth-session.service';

@Component({
  selector: 'app-pending-approval',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
  templateUrl: './pending-approval.page.html',
  styleUrl: './pending-approval.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingApprovalPage {
  private readonly authSession = inject(AuthSessionService);

  readonly currentUser = this.authSession.currentUser;
  readonly isRejected = computed(() => this.currentUser()?.status === 'REJECTED');
  readonly rejectionReason = computed(() => (this.currentUser() as any)?.rejection_reason || null);

  constructor() {
    addIcons({
      checkmarkCircle,
      'checkmark-circle': checkmarkCircle,
      closeCircle,
      'close-circle': closeCircle,
      timeOutline,
      'time-outline': timeOutline,
      shieldCheckmarkOutline,
      'shield-checkmark-outline': shieldCheckmarkOutline,
      logOutOutline,
      'log-out-outline': logOutOutline,
      alertCircleOutline,
      'alert-circle-outline': alertCircleOutline,
    });
  }

  logout(): void {
    this.authSession.logout(true);
  }
}
