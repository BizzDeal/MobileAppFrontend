import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SplashScreenService {
  private _isSplashVisible = new BehaviorSubject<boolean>(true);
  
  /**
   * Observable that emits the current visibility state of the splash screen.
   * True means the splash screen is currently loading/visible.
   * False means the splash screen has been completely removed.
   */
  readonly isSplashVisible$ = this._isSplashVisible.asObservable();

  /**
   * Marks the splash screen as hidden, allowing deferred operations (like HTTP calls) to proceed.
   */
  hideSplash(): void {
    if (this._isSplashVisible.value) {
      this._isSplashVisible.next(false);
    }
  }

  /**
   * Returns the current synchronous value of the splash screen visibility.
   */
  get isVisible(): boolean {
    return this._isSplashVisible.value;
  }
}
