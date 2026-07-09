import { inject, Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ReferralDTO } from '../models/referral.model';

const DUMMY_REFERRALS: ReferralDTO[] = [
  {
    id: 'ref-1',
    referrer_id: 'cust-101',
    referred_phone: '9876543211',
    referred_user_id: 'user-201',
    referral_code: 'BD-TEJA-3210',
    status: 'JOINED',
    reward_amount: 0,
    rewarded_at: null,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'ref-2',
    referrer_id: 'cust-101',
    referred_phone: '9876543212',
    referred_user_id: null,
    referral_code: 'BD-TEJA-3210',
    status: 'PENDING',
    reward_amount: 0,
    rewarded_at: null,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'ref-3',
    referrer_id: 'cust-101',
    referred_phone: '9876543213',
    referred_user_id: null,
    referral_code: 'BD-TEJA-3210',
    status: 'CANCELLED',
    reward_amount: 0,
    rewarded_at: null,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 10).toISOString()
  }
];

@Injectable({
  providedIn: 'root',
})
export class ReferralsService {
  private readonly referralList = signal<ReferralDTO[]>(DUMMY_REFERRALS);

  findAll(): Observable<ReferralDTO[]> {
    return of(this.referralList()).pipe(delay(400));
  }

  create(referredPhone: string, referralCode: string): Observable<ReferralDTO> {
    const newReferral: ReferralDTO = {
      id: `ref-${Math.random().toString(36).substr(2, 9)}`,
      referrer_id: 'cust-101',
      referred_phone: referredPhone,
      referred_user_id: null,
      referral_code: referralCode,
      status: 'PENDING',
      reward_amount: 0,
      rewarded_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Update local signal state
    this.referralList.update((curr) => [newReferral, ...curr]);

    return of(newReferral).pipe(delay(500));
  }
}
