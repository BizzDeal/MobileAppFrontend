import { Injectable, OnDestroy } from '@angular/core';
import { 
  ModalController, 
  ActionSheetController, 
  PopoverController, 
  AlertController 
} from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root'
})
export class AppBackButtonService implements OnDestroy {
  private overlayCount = 0;
  private initialized = false;

  constructor(
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private popoverCtrl: PopoverController,
    private alertCtrl: AlertController
  ) {}

  init() {
    if (this.initialized) return;
    
    // Listen for any overlay presenting
    document.addEventListener('ionModalDidPresent', this.onOverlayPresent);
    document.addEventListener('ionActionSheetDidPresent', this.onOverlayPresent);
    document.addEventListener('ionAlertDidPresent', this.onOverlayPresent);
    document.addEventListener('ionPopoverDidPresent', this.onOverlayPresent);

    // Listen for any overlay dismissing
    document.addEventListener('ionModalDidDismiss', this.onOverlayDismiss);
    document.addEventListener('ionActionSheetDidDismiss', this.onOverlayDismiss);
    document.addEventListener('ionAlertDidDismiss', this.onOverlayDismiss);
    document.addEventListener('ionPopoverDidDismiss', this.onOverlayDismiss);

    // Listen for browser back button (popstate)
    window.addEventListener('popstate', this.onPopState);

    this.initialized = true;
  }

  ngOnDestroy() {
    document.removeEventListener('ionModalDidPresent', this.onOverlayPresent);
    document.removeEventListener('ionActionSheetDidPresent', this.onOverlayPresent);
    document.removeEventListener('ionAlertDidPresent', this.onOverlayPresent);
    document.removeEventListener('ionPopoverDidPresent', this.onOverlayPresent);

    document.removeEventListener('ionModalDidDismiss', this.onOverlayDismiss);
    document.removeEventListener('ionActionSheetDidDismiss', this.onOverlayDismiss);
    document.removeEventListener('ionAlertDidDismiss', this.onOverlayDismiss);
    document.removeEventListener('ionPopoverDidDismiss', this.onOverlayDismiss);

    window.removeEventListener('popstate', this.onPopState);
  }

  private onOverlayPresent = () => {
    this.overlayCount++;
    // Push a dummy state to history to absorb the next back button press.
    // The state is explicitly marked so we know it's an overlay state.
    history.pushState({ isOverlay: true }, '', location.href);
  };

  private onOverlayDismiss = () => {
    this.overlayCount = Math.max(0, this.overlayCount - 1);
    // If the overlay was closed manually or by native physical back button, 
    // the dummy state is still at the top of the history stack.
    // We must remove it by going back, which will trigger popstate,
    // but our handler won't dismiss anything since the overlay is already closed.
    if (history.state && history.state.isOverlay) {
       history.back();
    }
  };

  private onPopState = async (event: PopStateEvent) => {
    // Check if an overlay is actually open using the Ionic controllers.
    try {
      // Check in typical order of stacking
      const modal = await this.modalCtrl.getTop();
      if (modal) {
        await modal.dismiss();
        return;
      } 
      
      const actionSheet = await this.actionSheetCtrl.getTop();
      if (actionSheet) {
        await actionSheet.dismiss();
        return;
      } 
      
      const popover = await this.popoverCtrl.getTop();
      if (popover) {
        await popover.dismiss();
        return;
      } 
      
      const alert = await this.alertCtrl.getTop();
      if (alert) {
        await alert.dismiss();
        return;
      }
    } catch (e) {
      console.error('Error dismissing overlay on back button', e);
    }
  };
}
