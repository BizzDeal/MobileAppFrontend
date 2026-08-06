import { Routes } from '@angular/router';
import { guestGuard } from '../../core/guards/guest.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/email-login/email-login.page').then(m => m.EmailLoginPage),
    canActivate: [guestGuard],
  },
  {
    path: 'forgot-pin',
    loadComponent: () => import('./pages/forgot-pin/forgot-pin.page').then(m => m.ForgotPinPage),
    canActivate: [guestGuard],
  },
  {
    path: 'member-registration',
    loadComponent: () => import('./pages/member-registration/member-registration.page').then(m => m.MemberRegistrationPage),
    canActivate: [guestGuard],
  },
  {
    path: 'member-payment',
    loadComponent: () => import('./pages/member-payment/member-payment.page').then(m => m.MemberPaymentPage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
