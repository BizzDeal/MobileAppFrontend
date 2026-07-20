import { Routes } from '@angular/router';
import { guestGuard } from '../../core/guards/guest.guard';

// Static imports
import { EmailLoginPage } from './pages/email-login/email-login.page';
import { ForgotPinPage } from './pages/forgot-pin/forgot-pin.page';
import { MemberRegistrationPage } from './pages/member-registration/member-registration.page';
import { MemberPaymentPage } from './pages/member-payment/member-payment.page';
import { VerifyEmailComponent } from './pages/verify-email/verify-email.component';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    component: EmailLoginPage,
    canActivate: [guestGuard],
  },
  {
    path: 'forgot-pin',
    component: ForgotPinPage,
    canActivate: [guestGuard],
  },
  {
    path: 'member-registration',
    component: MemberRegistrationPage,
    canActivate: [guestGuard],
  },
  {
    path: 'member-payment',
    component: MemberPaymentPage,
  },
  {
    path: 'verify-email',
    component: VerifyEmailComponent,
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
