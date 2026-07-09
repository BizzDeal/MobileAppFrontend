// App Routing Configuration
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'business-directory',
    loadComponent: () => import('./features/business/pages/business-directory/business-directory.page').then(m => m.BusinessDirectoryPage),
  },
  {
    path: 'offers/new',
    loadComponent: () => import('./features/business/pages/offer-form/offer-form.page').then(m => m.OfferFormPage),
  },
  {
    path: 'offers/:id/edit',
    loadComponent: () => import('./features/business/pages/offer-form/offer-form.page').then(m => m.OfferFormPage),
  },
  {
    path: 'vouchers/issue',
    loadComponent: () => import('./features/business/pages/issue-voucher/issue-voucher.page').then(m => m.IssueVoucherPage),
  },
  {
    path: 'vouchers/redeem',
    loadComponent: () => import('./features/business/pages/redeem-voucher/redeem-voucher.page').then(m => m.RedeemVoucherPage),
  },
  {
    // Lazy-loaded member analytics dashboard
    path: 'analytics',
    loadComponent: () => import('./features/analytics/pages/analytics-dashboard/analytics-dashboard.page').then(m => m.AnalyticsDashboardPage),
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
];
