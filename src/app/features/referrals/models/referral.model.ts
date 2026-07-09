export type ReferralStatus = 'PENDING' | 'JOINED' | 'REWARDED' | 'CANCELLED';

export interface ReferralDTO {
  id: string;
  referrer_id: string;
  referred_phone: string;
  referred_user_id: string | null;
  referral_code: string;
  status: ReferralStatus;
  reward_amount: number;
  rewarded_at: string | null;
  created_at: string;
  updated_at: string;
}
