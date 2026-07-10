// App Routing Configuration
import { Routes } from '@angular/router';

// Static imports
import { AUTH_ROUTES } from './features/auth/auth.routes';
import { HomePage } from './home/home.page';
import { BusinessDirectoryPage } from './features/business/pages/business-directory/business-directory.page';
import { OfferFormPage } from './features/business/pages/offer-form/offer-form.page';
import { IssueVoucherPage } from './features/business/pages/issue-voucher/issue-voucher.page';
import { RedeemVoucherPage } from './features/business/pages/redeem-voucher/redeem-voucher.page';
import { AnalyticsDashboardPage } from './features/analytics/pages/analytics-dashboard/analytics-dashboard.page';
import { ADMIN_ROUTES } from './features/admin/admin.routes';

export const routes: Routes = [
  {
    path: 'auth',
    children: AUTH_ROUTES,
  },
  {
    path: 'home',
    component: HomePage,
  },
  {
    path: 'business-directory',
    component: BusinessDirectoryPage,
  },
  {
    path: 'offers/new',
    component: OfferFormPage,
  },
  {
    path: 'offers/:id/edit',
    component: OfferFormPage,
  },
  {
    path: 'vouchers/issue',
    component: IssueVoucherPage,
  },
  {
    path: 'vouchers/redeem',
    component: RedeemVoucherPage,
  },
  {
    path: 'analytics',
    component: AnalyticsDashboardPage,
  },
  {
    path: 'admin',
    children: ADMIN_ROUTES,
  },
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
];
