import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MemberOnboardingService } from '../../services/member-onboarding.service';
import { extractFriendlyErrorMessage } from '../../../../core/utils/error.utils';
import { AnimatedBackgroundComponent } from '../../../../shared/components/animated-background/animated-background.component';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule, AnimatedBackgroundComponent],
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly onboardingService = inject(MemberOnboardingService);

  readonly isLoading = signal<boolean>(true);
  readonly isSuccess = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.errorMessage.set('No verification token provided in the URL.');
      this.isLoading.set(false);
      return;
    }

    this.verifyToken(token);
  }

  private async verifyToken(token: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      await this.onboardingService.verifyEmail(token);
      this.isSuccess.set(true);
    } catch (err: any) {
      this.errorMessage.set(extractFriendlyErrorMessage(err, 'Verification failed. The link may have expired or is invalid.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
