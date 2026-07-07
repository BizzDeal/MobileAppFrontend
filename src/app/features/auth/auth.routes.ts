import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/phone-login/phone-login.page').then((m) => m.PhoneLoginPage),
  },
  {
    path: 'forgot-pin',
    loadComponent: () =>
      import('./pages/forgot-pin/forgot-pin.page').then((m) => m.ForgotPinPage),
  },
  {
    path: 'member-registration',
    loadComponent: () =>
      import('./pages/member-registration/member-registration.page').then((m) => m.MemberRegistrationPage),
  },
  {
    path: 'member-payment',
    loadComponent: () =>
      import('./pages/member-payment/member-payment.page').then((m) => m.MemberPaymentPage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
