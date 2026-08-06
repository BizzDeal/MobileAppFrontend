// App Routing Configuration
import { Routes } from '@angular/router';

// Static imports
import { AUTH_ROUTES } from './features/auth/auth.routes';
import { HomePage } from './home/home.page';
import { BusinessDirectoryPage } from './features/business/pages/business-directory/business-directory.page';
import { OfferFormPage } from './features/business/pages/offer-form/offer-form.page';
import { BizzCoinsOfferPage } from './features/business/pages/bizz-coins-offer/bizz-coins-offer.page';
import { IssueVoucherPage } from './features/business/pages/issue-voucher/issue-voucher.page';
import { IssueBizzCoinsPage } from './features/business/pages/issue-bizz-coins/issue-bizz-coins.page';
import { RedeemVoucherPage } from './features/business/pages/redeem-voucher/redeem-voucher.page';
import { RedeemBizzCoinsPage } from './features/business/pages/redeem-bizz-coins/redeem-bizz-coins.page';
import { AnalyticsDashboardPage } from './features/analytics/pages/analytics-dashboard/analytics-dashboard.page';
import { ADMIN_ROUTES } from './features/admin/admin.routes';
import { authGuard } from './core/guards/auth.guard';
import { UserRole } from './features/auth/models/auth.model';

export const routes: Routes = [
  {
    path: 'auth',
    children: AUTH_ROUTES,
  },
  {
    path: 'home',
    component: HomePage,
    canActivate: [authGuard],
  },
  {
    path: 'business-directory',
    component: BusinessDirectoryPage,
    canActivate: [authGuard],
  },
  {
    path: 'offers/bizz-coins',
    component: BizzCoinsOfferPage,
    canActivate: [authGuard],
    data: { roles: [UserRole.MEMBER, UserRole.ADMIN] },
  },
  {
    path: 'offers/new',
    component: OfferFormPage,
    canActivate: [authGuard],
    data: { roles: [UserRole.MEMBER, UserRole.ADMIN] },
  },
  {
    path: 'offers/:id/edit',
    component: OfferFormPage,
    canActivate: [authGuard],
    data: { roles: [UserRole.MEMBER, UserRole.ADMIN] },
  },
  {
    path: 'vouchers/issue',
    component: IssueVoucherPage,
    canActivate: [authGuard],
    data: { roles: [UserRole.MEMBER, UserRole.ADMIN] },
  },
  {
    path: 'vouchers/issue-bizz-coins',
    component: IssueBizzCoinsPage,
    canActivate: [authGuard],
    data: { roles: [UserRole.MEMBER, UserRole.ADMIN] },
  },
  {
    path: 'vouchers/redeem',
    component: RedeemVoucherPage,
    canActivate: [authGuard],
    data: { roles: [UserRole.MEMBER, UserRole.ADMIN] },
  },
  {
    path: 'vouchers/redeem-bizz-coins',
    component: RedeemBizzCoinsPage,
    canActivate: [authGuard],
    data: { roles: [UserRole.MEMBER, UserRole.ADMIN] },
  },
  {
    path: 'analytics',
    component: AnalyticsDashboardPage,
    canActivate: [authGuard],
    data: { roles: [UserRole.MEMBER, UserRole.ADMIN] },
  },
  {
    path: 'admin',
    children: ADMIN_ROUTES,
    canActivate: [authGuard],
    data: { roles: [UserRole.ADMIN] },
  },
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
];
