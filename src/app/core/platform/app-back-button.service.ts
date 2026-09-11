import { Injectable, OnDestroy, Injector, NgZone } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { 
  ModalController, 
  ActionSheetController, 
  PopoverController, 
  AlertController 
} from '@ionic/angular/standalone';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthSessionService } from '../services/auth-session.service';
import { ChatService } from '../../features/chat/services/chat.service';

@Injectable({
  providedIn: 'root'
})
export class AppBackButtonService implements OnDestroy {
  private historyStack: string[] = [];
  private isGoingBack = false;
  private initialized = false;
  private routerSub?: Subscription;
  private capBackListener?: PluginListenerHandle;
  private customOverlayHandlers: Array<() => boolean> = [];
  private isPromptingLogout = false;

  constructor(
    private router: Router,
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private popoverCtrl: PopoverController,
    private alertCtrl: AlertController,
    private ngZone: NgZone,
    private injector: Injector
  ) {}

  init(): void {
    if (this.initialized) return;

    // Initialize stack with current URL
    const initialUrl = this.router.url || '/';
    this.historyStack = [initialUrl];

    // Track navigation history
    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects || event.url;
        if (this.isGoingBack) {
          this.isGoingBack = false;
          return;
        }

        // Avoid adding duplicate of top element
        if (this.historyStack.length === 0 || this.historyStack[this.historyStack.length - 1] !== url) {
          this.historyStack.push(url);
          // Limit stack depth to 50
          if (this.historyStack.length > 50) {
            this.historyStack.shift();
          }
        }
      });

    // Native Capacitor back button listener
    if (Capacitor.isNativePlatform()) {
      CapApp.addListener('backButton', () => {
        this.ngZone.run(() => {
          this.handleBackButton();
        });
      }).then(handle => {
        this.capBackListener = handle;
      }).catch(err => {
        console.error('Error adding Capacitor backButton listener:', err);
      });
    }

    // Web browser back button listener
    window.addEventListener('popstate', this.onPopState);

    this.initialized = true;
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.capBackListener?.remove();
    window.removeEventListener('popstate', this.onPopState);
  }

  /**
   * Register custom overlay dismiss handler (e.g. drawer, custom modals, popups).
   * Returns an unregister function.
   * Handler must return true if it dismissed an overlay, false otherwise.
   */
  registerCustomOverlayDismissHandler(handler: () => boolean): () => void {
    this.customOverlayHandlers.push(handler);
    return () => {
      this.customOverlayHandlers = this.customOverlayHandlers.filter(h => h !== handler);
    };
  }

  registerOverlayDismissHandler(handler: () => boolean): () => void {
    return this.registerCustomOverlayDismissHandler(handler);
  }

  /**
   * Check if the user is currently on the root Home Page
   */
  isHomePage(): boolean {
    const url = this.router.url || '';
    const [path, queryString] = url.split('?');

    // Admin dashboard is the admin home
    if (path === '/admin/dashboard' || path === '/admin') {
      return true;
    }

    // Member / Customer home is /home when tab is 'home' or no tab query
    if (path === '/home') {
      if (!queryString) return true;
      const params = new URLSearchParams(queryString);
      const tab = params.get('tab');
      return !tab || tab === 'home';
    }

    return false;
  }

  /**
   * Navigate back to the previous page/tab in the stack.
   */
  back(fallbackUrl?: string): void {
    this.isGoingBack = true;

    if (this.historyStack.length > 1) {
      this.historyStack.pop(); // Remove current URL
      const previousUrl = this.historyStack[this.historyStack.length - 1];
      this.router.navigateByUrl(previousUrl).catch(() => {
        this.fallbackNavigate(fallbackUrl);
      });
    } else {
      this.fallbackNavigate(fallbackUrl);
    }
  }

  private fallbackNavigate(fallbackUrl?: string): void {
    const target = fallbackUrl || this.getDefaultFallback();
    this.historyStack = [target];
    this.router.navigateByUrl(target).catch(() => {});
  }

  private getDefaultFallback(): string {
    const url = this.router.url || '';
    if (url.startsWith('/admin')) {
      return '/admin/dashboard';
    }
    return '/home';
  }

  /**
   * Centralized Back Button Handler:
   * 1. Closes Framework Overlays (Alert, ActionSheet, Popover, Modal)
   * 2. Closes Custom Registered Overlays (Drawers, Filter Modals, Lightboxes, Popups)
   * 3. Closes Sub-State (e.g. Chat Room back to list)
   * 4. Prompts for Logout on Home Page
   * 5. Navigates back to previous page/tab
   */
  async handleBackButton(): Promise<void> {
    // 1. Framework Alert
    const topAlert = await this.alertCtrl.getTop();
    if (topAlert) {
      await topAlert.dismiss();
      return;
    }

    // 2. Framework ActionSheet
    const topActionSheet = await this.actionSheetCtrl.getTop();
    if (topActionSheet) {
      await topActionSheet.dismiss();
      return;
    }

    // 3. Framework Popover
    const topPopover = await this.popoverCtrl.getTop();
    if (topPopover) {
      await topPopover.dismiss();
      return;
    }

    // 4. Framework Modal
    const topModal = await this.modalCtrl.getTop();
    if (topModal) {
      await topModal.dismiss();
      return;
    }

    // 5. Custom Overlays (Admin Drawer, Custom Modals, Lightbox, Support Popup, FAB menu)
    for (let i = this.customOverlayHandlers.length - 1; i >= 0; i--) {
      try {
        if (this.customOverlayHandlers[i]()) {
          return;
        }
      } catch (e) {
        console.error('Error executing custom overlay handler:', e);
      }
    }

    // 6. Sub-State: Active Chat Conversation
    try {
      const chatService = this.injector.get(ChatService);
      if (chatService && chatService.activeConversationId()) {
        chatService.setActiveConversation(null);
        return;
      }
    } catch {
      // ChatService not loaded yet
    }

    // 7. Home Page: Prompt for Logout
    if (this.isHomePage()) {
      await this.promptLogout();
      return;
    }

    // 8. Navigate back to previous page/tab
    this.back();
  }

  /**
   * Prompt user with confirmation dialog when pressing back on Home page.
   */
  async promptLogout(): Promise<void> {
    if (this.isPromptingLogout) return;

    const existingAlert = await this.alertCtrl.getTop();
    if (existingAlert) return;

    this.isPromptingLogout = true;

    const alert = await this.alertCtrl.create({
      header: 'Confirm Logout',
      message: 'Are you sure you want to log out of BizzDeal?',
      backdropDismiss: true,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            this.isPromptingLogout = false;
          }
        },
        {
          text: 'Logout',
          role: 'destructive',
          handler: async () => {
            this.isPromptingLogout = false;
            try {
              const authSession = this.injector.get(AuthSessionService);
              await authSession.logout(true);
            } catch (err) {
              console.error('Error logging out:', err);
              this.router.navigate(['/auth/login'], { replaceUrl: true });
            }
          }
        }
      ]
    });

    alert.onDidDismiss().then(() => {
      this.isPromptingLogout = false;
    });

    await alert.present();
  }

  private onPopState = async (event: PopStateEvent): Promise<void> => {
    // Check if any overlay is open
    const topAlert = await this.alertCtrl.getTop();
    if (topAlert) {
      await topAlert.dismiss();
      history.pushState(null, '', location.href);
      return;
    }

    const topActionSheet = await this.actionSheetCtrl.getTop();
    if (topActionSheet) {
      await topActionSheet.dismiss();
      history.pushState(null, '', location.href);
      return;
    }

    const topPopover = await this.popoverCtrl.getTop();
    if (topPopover) {
      await topPopover.dismiss();
      history.pushState(null, '', location.href);
      return;
    }

    const topModal = await this.modalCtrl.getTop();
    if (topModal) {
      await topModal.dismiss();
      history.pushState(null, '', location.href);
      return;
    }

    for (let i = this.customOverlayHandlers.length - 1; i >= 0; i--) {
      if (this.customOverlayHandlers[i]()) {
        history.pushState(null, '', location.href);
        return;
      }
    }

    try {
      const chatService = this.injector.get(ChatService);
      if (chatService && chatService.activeConversationId()) {
        chatService.setActiveConversation(null);
        history.pushState(null, '', location.href);
        return;
      }
    } catch {
      // ChatService not loaded yet
    }

    if (this.isHomePage()) {
      history.pushState(null, '', location.href);
      await this.promptLogout();
    }
  };
}
