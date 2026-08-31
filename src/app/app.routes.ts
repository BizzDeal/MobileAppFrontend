import { inject } from '@angular/core';
import { Routes, Router } from '@angular/router';
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
    redirectTo: () => {
      const router = inject(Router);
      return router.createUrlTree(['/home'], { queryParams: { tab: 'members' } });
    },
  },
  {
    path: 'offers/bizz-coins',
    loadComponent: () => import('./features/business/pages/bizz-coins-offer/bizz-coins-offer.page').then(m => m.BizzCoinsOfferPage),
    canActivate: [authGuard],
    data: { roles: [UserRole.MEMBER, UserRole.ADMIN] },
  },
  {
    path: 'offers/my-deals',
    loadComponent: () => import('./features/business/pages/my-deals/my-deals.page').then(m => m.MyDealsPage),
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
    path: 'videos/category/:categoryKey',
    loadComponent: () => import('./features/videos/pages/video-category-list/video-category-list.page').then(m => m.VideoCategoryListPage),
    canActivate: [authGuard],
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
    path: 'wallet/earn-bizz-coins',
    loadComponent: () => import('./features/wallet/pages/earn-bizz-coins/earn-bizz-coins.page').then(m => m.EarnBizzCoinsPage),
    canActivate: [authGuard],
  },
  {
    path: 'wallet/earn-wallet-points',
    loadComponent: () => import('./features/wallet/pages/earn-wallet-points/earn-wallet-points.page').then(m => m.EarnWalletPointsPage),
    canActivate: [authGuard],
  },
  {
    path: 'wallet/my-redemptions',
    loadComponent: () => import('./features/wallet/pages/my-redemptions/my-redemptions.page').then(m => m.MyRedemptionsPage),
    canActivate: [authGuard],
  },
  {
    path: 'wallet/history',
    loadComponent: () => import('./features/wallet/pages/wallet-history/wallet-history.page').then(m => m.WalletHistoryPage),
    canActivate: [authGuard],
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
