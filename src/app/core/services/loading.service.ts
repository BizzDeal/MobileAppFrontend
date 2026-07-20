import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private activeRequests = 0;
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();
  
  private hideTimeout: any;
  private readonly HIDE_DELAY_MS = 300; // Delay before hiding to prevent flicker on rapid requests

  show() {
    if (this.activeRequests === 0) {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
      this.isLoadingSubject.next(true);
    }
    this.activeRequests++;
  }

  hide() {
    this.activeRequests--;
    if (this.activeRequests <= 0) {
      this.activeRequests = 0;
      
      this.hideTimeout = setTimeout(() => {
        this.isLoadingSubject.next(false);
      }, this.HIDE_DELAY_MS);
    }
  }
}
