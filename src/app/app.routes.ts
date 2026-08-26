import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { UserRole } from './features/auth/models/auth.model';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: 'payment/registration',
    loadComponent: () => import('./features/auth/pages/member-payment/member-payment.page').then(m => m.MemberPaymentPage),
    canActivate: [authGuard],
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage),
    canActivate: [authGuard],
  },
  {
    path: 'business-directory',
    loadComponent: () => import('./features/business/pages/business-directory/business-directory.page').then(m => m.BusinessDirectoryPage),
    canActivate: [authGuard],
  },
  {
    path: 'offers/bizz-coins',
    loadComponent: () => import('./features/business/pages/bizz-coins-offer/bizz-coins-offer.page').then(m => m.BizzCoinsOfferPage),
    canActivate: [authGuard],
    data: { roles: [UserRole.MEMBER, UserRole.ADMIN] },
  },
  {
    path: 'offers/new',
    loadComponent: () => import('./features/business/pages/offer-form/offer-form.page').then(m => m.OfferFormPage),
    canActivate: [authGuard],
    data: { roles: [UserRole.MEMBER, UserRole.ADMIN] },
  },
  {
    path: 'offers/:id/edit',
    loadComponent: () => import('./features/business/pages/offer-form/offer-form.page').then(m => m.OfferFormPage),
    canActivate: [authGuard],
    data: { roles: [UserRole.MEMBER, UserRole.ADMIN] },
  },
  {
    path: 'videos/new',
    loadComponent: () => import('./features/videos/pages/video-form/video-form.page').then(m => m.VideoFormPage),
    canActivate: [authGuard],
    data: { roles: [UserRole.MEMBER, UserRole.ADMIN] },
  },
  {
    path: 'videos/:id/edit',
    loadComponent: () => import('./features/videos/pages/video-form/video-form.page').then(m => m.VideoFormPage),
    canActivate: [authGuard],
    data: { roles: [UserRole.MEMBER, UserRole.ADMIN] },
  },
  {
    path: 'vouchers/issue',
    loadComponent: () => import('./features/business/pages/issue-voucher/issue-voucher.page').then(m => m.IssueVoucherPage),
    canActivate: [authGuard],
    data: { roles: [UserRole.MEMBER, UserRole.ADMIN] },
  },
  {
    path: 'vouchers/redeem',
    loadComponent: () => import('./features/business/pages/redeem-voucher/redeem-voucher.page').then(m => m.RedeemVoucherPage),
    canActivate: [authGuard],
    data: { roles: [UserRole.MEMBER, UserRole.ADMIN] },
  },
  {
    path: 'vouchers/redeem-bizz-coins',
    loadComponent: () => import('./features/business/pages/redeem-bizz-coins/redeem-bizz-coins.page').then(m => m.RedeemBizzCoinsPage),
    canActivate: [authGuard],
    data: { roles: [UserRole.MEMBER, UserRole.ADMIN] },
  },
  {
    path: 'analytics',
    loadComponent: () => import('./features/analytics/pages/analytics-dashboard/analytics-dashboard.page').then(m => m.AnalyticsDashboardPage),
    canActivate: [authGuard],
    data: { roles: [UserRole.MEMBER, UserRole.ADMIN] },
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
    canActivate: [authGuard],
    data: { roles: [UserRole.ADMIN] },
  },
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
];
