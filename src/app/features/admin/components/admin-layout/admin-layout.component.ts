import { Component, OnInit, OnDestroy } from '@angular/core';

import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { AdminLogoutButtonComponent } from '../admin-logout-button/admin-logout-button.component';
import { AdminReferralsFilterModalComponent } from '../admin-referrals-filter-modal/admin-referrals-filter-modal.component';
import { AdminReferralsStateService, AdminReferralsFilter } from '../../services/admin-referrals-state.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import { menuOutline, closeOutline, filterOutline } from 'ionicons/icons';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
  standalone: true,
  imports: [IonicModule, RouterModule, AdminSidebarComponent, AdminLogoutButtonComponent, AdminReferralsFilterModalComponent]
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  isMobileDrawerOpen = false;
  currentTitle = 'Dashboard';
  isDetailPage = false;
  isFilterOpen = false;
  currentFilterState: AdminReferralsFilter = { startDate: null, endDate: null, stateId: null, districtId: null };
  private routerSub!: Subscription;

  constructor(
    private router: Router,
    private adminReferralsStateService: AdminReferralsStateService
  ) {
    addIcons({ menuOutline, closeOutline, filterOutline });
    this.updateRouteState(this.router.url);
  }

  ngOnInit(): void {
    this.routerSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.isMobileDrawerOpen = false;
        this.updateRouteState(event.urlAfterRedirects || event.url);
      });

    this.adminReferralsStateService.filter$.subscribe(filter => {
      this.currentFilterState = filter;
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
    if (url.includes('/admin/chat')) return 'Chat';
    if (url.includes('/admin/payment-details')) return 'Payment Details';
    if (url.includes('/admin/referrals')) return 'Referrals';
    if (url.includes('/admin/meetings')) return 'Meetings';
    if (url.includes('/admin/settings')) return 'Platform Settings';
    if (url.includes('/admin/categories')) return 'Business Categories';
    return 'Dashboard';
  }

  onFilterApplied(event: AdminReferralsFilter): void {
    this.adminReferralsStateService.setFilter(event);
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
