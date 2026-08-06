import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/admin-dashboard/admin-dashboard.page').then(m => m.AdminDashboardPage),
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/admin-users/admin-users.page').then(m => m.AdminUsersPage),
      },
      {
        path: 'users/:id',
        loadComponent: () => import('./pages/admin-user-details/admin-user-details.page').then(m => m.AdminUserDetailsPage),
      },
      {
        path: 'businesses',
        loadComponent: () => import('./pages/admin-businesses/admin-businesses.page').then(m => m.AdminBusinessesPage),
      },
      {
        path: 'businesses/:id',
        loadComponent: () => import('./pages/admin-business-details/admin-business-details.page').then(m => m.AdminBusinessDetailsPage),
      },
      {
        path: 'offers',
        loadComponent: () => import('./pages/admin-offers/admin-offers.page').then(m => m.AdminOffersPage),
      },
      {
        path: 'categories',
        loadComponent: () => import('./pages/admin-categories/admin-categories.page').then(m => m.AdminCategoriesPage),
      },
      {
        path: 'referrals',
        loadComponent: () => import('./pages/admin-referrals/admin-referrals.page').then(m => m.AdminReferralsPage),
      },
      {
        path: 'meetings',
        loadComponent: () => import('./pages/admin-meetings/admin-meetings.page').then(m => m.AdminMeetingsPage),
      },
      {
        path: 'chat',
        loadComponent: () => import('./pages/admin-chat/admin-chat.page').then(m => m.AdminChatPage),
      },
      {
        path: 'payment-details',
        loadComponent: () => import('./pages/admin-payment-details/admin-payment-details.page').then(m => m.AdminPaymentDetailsPage),
      },
      {
        path: 'notifications',
        loadComponent: () => import('./pages/admin-notifications/admin-notifications.page').then(m => m.AdminNotificationsPage),
      },
      {
        path: 'analytics',
        loadComponent: () => import('./pages/admin-analytics/admin-analytics.page').then(m => m.AdminAnalyticsPage),
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/admin-settings/admin-settings.page').then(m => m.AdminSettingsPage),
      },
    ],
  },
];
