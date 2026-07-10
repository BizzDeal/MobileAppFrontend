import { Routes } from '@angular/router';

// Static imports
import { PhoneLoginPage } from './pages/phone-login/phone-login.page';
import { ForgotPinPage } from './pages/forgot-pin/forgot-pin.page';
import { MemberRegistrationPage } from './pages/member-registration/member-registration.page';
import { MemberPaymentPage } from './pages/member-payment/member-payment.page';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    component: PhoneLoginPage,
  },
  {
    path: 'forgot-pin',
    component: ForgotPinPage,
  },
  {
    path: 'member-registration',
    component: MemberRegistrationPage,
  },
  {
    path: 'member-payment',
    component: MemberPaymentPage,
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
