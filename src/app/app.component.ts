import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule, NavigationEnd, NavigationStart } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { StatusBarService } from './core/platform/statusbar.service';
import { PermissionsService } from './core/platform/permissions.service';
import { AppBackButtonService } from './core/platform/app-back-button.service';
import { NotificationService } from './features/notifications/services/notification.service';
import { SplashScreenComponent } from './shared/components/splash-screen/splash-screen.component';
import { SmartLoadingScreenComponent } from './shared/components/smart-loading-screen/smart-loading-screen.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    SplashScreenComponent,
    SmartLoadingScreenComponent
  ],
})
export class AppComponent implements OnInit, OnDestroy {
  isAdminRoute = false;
  showSplash = true;
  private routerSub!: Subscription;

  constructor(
    private router: Router,
    private statusBarService: StatusBarService,
    private permissionsService: PermissionsService,
    private appBackButtonService: AppBackButtonService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.statusBarService.initialize();
    this.permissionsService.requestStartupPermissions();
    this.appBackButtonService.init();
    this.notificationService.initPushNotificationsOnStartup();
    this.updateRouteState(this.router.url);

    setTimeout(() => {
      this.hideSplash();
    }, 3000);

    this.routerSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationStart || e instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event instanceof NavigationStart ? event.url : event.urlAfterRedirects;
        this.updateRouteState(url);
      });
  }

  private hideSplash() {
    if ((document as any).startViewTransition) {
      (document as any).startViewTransition(() => {
        this.showSplash = false;
        document.body.classList.add('splash-removed');
        this.cdr.detectChanges();
      }).finished.then(() => {
        document.body.classList.remove('splash-removed');
      });
    } else {
      this.showSplash = false;
      this.cdr.detectChanges();
    }
  }

  private updateRouteState(url: string = ''): void {
    const isAdmin = url ? url.startsWith('/admin') : false;
    this.isAdminRoute = isAdmin;
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }
}
