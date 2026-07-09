export interface MemberDashboardAnalytics {
  activeOffersCount: number;
  vouchersRedeemedToday: number;
  vouchersRedeemedWeek: number;
  businessGrowth: number;
  successfulReferrals: number;
}

export interface MemberAlert {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  message: string;
  timestamp: string;
}

export interface MemberDashboardData {
  businessName: string;
  businessLogoUrl: string;
  analytics: MemberDashboardAnalytics;
  alerts: MemberAlert[];
  recentActivity: any[];
  myOffers: import('../../home/models/home.model').OfferDTO[];
}
