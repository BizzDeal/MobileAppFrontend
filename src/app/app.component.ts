import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterModule,
} from '@angular/router';
import {
  IonicModule,
  MenuController,
} from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  barChartOutline,
  businessOutline,
  gridOutline,
  logOutOutline,
  notificationsOutline,
  peopleOutline,
  pricetagsOutline,
  settingsOutline,
} from 'ionicons/icons';

import {
  filter,
  Subscription,
} from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
  ],
})
export class AppComponent implements OnInit, OnDestroy {
  isAdminRoute = false;

  readonly adminPages = [
    {
      title: 'Dashboard',
      url: '/admin/dashboard',
      icon: 'grid',
    },
    {
      title: 'Users',
      url: '/admin/users',
      icon: 'people',
    },
    {
      title: 'Businesses',
      url: '/admin/businesses',
      icon: 'business',
    },
    {
      title: 'Offers/Deals',
      url: '/admin/offers',
      icon: 'pricetags',
    },
    {
      title: 'Notifications',
      url: '/admin/notifications',
      icon: 'notifications',
    },
    {
      title: 'Analytics',
      url: '/admin/analytics',
      icon: 'bar-chart',
    },
    {
      title: 'Settings',
      url: '/admin/settings',
      icon: 'settings',
    },
  ];

  private routerSub?: Subscription;

  constructor(
    private readonly router: Router,
    private readonly menuCtrl: MenuController,
  ) {
    addIcons({
      barChartOutline,
      businessOutline,
      gridOutline,
      logOutOutline,
      notificationsOutline,
      peopleOutline,
      pricetagsOutline,
      settingsOutline,
    });
  }

  ngOnInit(): void {
    this.updateAdminRouteState(this.router.url);

    this.routerSub = this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd =>
            event instanceof NavigationEnd,
        ),
      )
      .subscribe((event) => {
        this.updateAdminRouteState(
          event.urlAfterRedirects,
        );
      });
  }

  logout(): void {
    void this.menuCtrl.close('admin-menu');

    void this.router.navigate([
      '/auth/login',
    ]);
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  private updateAdminRouteState(
    url: string,
  ): void {
    this.isAdminRoute = url.startsWith('/admin');

    if (!this.isAdminRoute) {
      void this.menuCtrl.close('admin-menu');
    }
  }
}
