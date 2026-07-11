import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import { menuOutline, closeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, AdminSidebarComponent]
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  isMobileDrawerOpen = false;
  currentTitle = 'Dashboard';
  isDetailPage = false;
  private routerSub!: Subscription;

  constructor(private router: Router) {
    addIcons({ menuOutline, closeOutline });
    this.updateRouteState(this.router.url);
  }

  ngOnInit(): void {
    this.routerSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.isMobileDrawerOpen = false;
        this.updateRouteState(event.urlAfterRedirects || event.url);
      });
  }

  private updateRouteState(url: string): void {
    this.isDetailPage = /\/admin\/(users|businesses)\/.+/.test(url);
    this.currentTitle = this.getPageTitle(url);
  }

  private getPageTitle(url: string): string {
    if (/\/admin\/users\/.+/.test(url)) return 'User Details';
    if (url.includes('/admin/users')) return 'Manage Users';
    if (/\/admin\/businesses\/.+/.test(url)) return 'Business Details';
    if (url.includes('/admin/businesses')) return 'Manage Businesses';
    if (url.includes('/admin/offers')) return 'Offers & Deals';
    if (url.includes('/admin/notifications')) return 'Push Notifications';
    if (url.includes('/admin/analytics')) return 'Analytics & Insights';
    return 'Dashboard';
  }

  toggleMobileDrawer(): void {
    this.isMobileDrawerOpen = !this.isMobileDrawerOpen;
  }

  closeMobileDrawer(): void {
    this.isMobileDrawerOpen = false;
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }
}
