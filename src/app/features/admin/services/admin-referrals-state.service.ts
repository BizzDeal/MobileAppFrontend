import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AdminReferralsFilter {
  startDate: string | null; // YYYY-MM-DD
  endDate: string | null;   // YYYY-MM-DD
  dates?: string | null;    // comma separated YYYY-MM-DD
  stateId: string | null;
  districtId: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AdminReferralsStateService {
  private filterSubject = new BehaviorSubject<AdminReferralsFilter>({ startDate: null, endDate: null, dates: null, stateId: null, districtId: null });
  public filter$ = this.filterSubject.asObservable();

  setFilter(filter: AdminReferralsFilter) {
    this.filterSubject.next(filter);
  }
}
