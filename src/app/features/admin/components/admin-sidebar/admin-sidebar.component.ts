import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { IonicModule, MenuController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  gridOutline,
  peopleOutline,
  businessOutline,
  pricetagsOutline,
  barChartOutline,
  settingsOutline,
  notificationsOutline,
  logOutOutline
} from 'ionicons/icons';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-sidebar',
  templateUrl: './admin-sidebar.component.html',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule]
})
export class AdminSidebarComponent implements OnInit, OnDestroy {
  isAdminRoute = false;

  readonly adminPages = [
    { title: 'Dashboard', url: '/admin/dashboard', icon: 'grid' },
    { title: 'Users', url: '/admin/users', icon: 'people' },
    { title: 'Businesses', url: '/admin/businesses', icon: 'business' },
    { title: 'Offers/Deals', url: '/admin/offers', icon: 'pricetags' },
    { title: 'Notifications', url: '/admin/notifications', icon: 'notifications' },
    { title: 'Analytics', url: '/admin/analytics', icon: 'bar-chart' },
    { title: 'Settings', url: '/admin/settings', icon: 'settings' },
  ];

  private routerSub!: Subscription;

  constructor(private router: Router, private menuCtrl: MenuController) {
    addIcons({
      gridOutline,
      peopleOutline,
      businessOutline,
      pricetagsOutline,
      barChartOutline,
      settingsOutline,
      notificationsOutline,
      logOutOutline
    });
  }

  ngOnInit() {
    this.updateAdminRouteState(this.router.url);

    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((event) => {
        this.updateAdminRouteState(event.urlAfterRedirects);
      });
  }

  private updateAdminRouteState(url: string): void {
    this.isAdminRoute = url.startsWith('/admin');

    if (!this.isAdminRoute) {
      void this.menuCtrl.close('admin-menu');
    }
  }

  logout(): void {
    this.menuCtrl.close('admin-menu');
    this.router.navigate(['/auth/login']);
  }

  ngOnDestroy(): void {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }
}
