import { Routes } from '@angular/router';

import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { AdminDashboardPage } from './pages/admin-dashboard/admin-dashboard.page';
import { AdminUsersPage } from './pages/admin-users/admin-users.page';
import { AdminUserDetailsPage } from './pages/admin-user-details/admin-user-details.page';
import { AdminBusinessesPage } from './pages/admin-businesses/admin-businesses.page';
import { AdminBusinessDetailsPage } from './pages/admin-business-details/admin-business-details.page';
import { AdminOffersPage } from './pages/admin-offers/admin-offers.page';
import { AdminNotificationsPage } from './pages/admin-notifications/admin-notifications.page';
import { AdminAnalyticsPage } from './pages/admin-analytics/admin-analytics.page';
import { AdminMeetingsPage } from './pages/admin-meetings/admin-meetings.page';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        component: AdminDashboardPage,
      },
      {
        path: 'users',
        component: AdminUsersPage,
      },
      {
        path: 'users/:id',
        component: AdminUserDetailsPage,
      },
      {
        path: 'businesses',
        component: AdminBusinessesPage,
      },
      {
        path: 'businesses/:id',
        component: AdminBusinessDetailsPage,
      },
      {
        path: 'offers',
        component: AdminOffersPage,
      },
      {
        path: 'meetings',
        component: AdminMeetingsPage,
      },
      {
        path: 'notifications',
        component: AdminNotificationsPage,
      },
      {
        path: 'analytics',
        component: AdminAnalyticsPage,
      },
    ],
  },
];
