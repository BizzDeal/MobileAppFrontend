export interface MemberDashboardAnalytics {
  activeOffersCount: number;
  vouchersRedeemedToday: number;
  vouchersRedeemedWeek: number;
  businessGrowth: number;
  successfulReferrals: number;
  referralsGiven: number;
  referralsGivenCompleted: number;
  givenBusinessValue: number;
  referralsReceived: number;
  referralsReceivedCompleted: number;
  receivedBusinessValue: number;
  districtStats?: {
    totalBusinesses: number;
    totalMembers: number;
    totalVouchers: number;
    revenue: number;
    totalReferrals?: number;
    totalBusinessValue?: number;
    districtName?: string;
  };
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
  bizzCoinOffer?: import('../../home/models/home.model').OfferDTO | null;
}
