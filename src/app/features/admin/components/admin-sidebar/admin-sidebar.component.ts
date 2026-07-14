import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  gridOutline,
  peopleOutline,
  businessOutline,
  pricetagsOutline,
  barChartOutline,
  settingsOutline,
  notificationsOutline,
  logOutOutline,
  chevronForwardOutline
} from 'ionicons/icons';
import { AuthSessionService } from '../../../../core/services/auth-session.service';

@Component({
  selector: 'app-admin-sidebar',
  templateUrl: './admin-sidebar.component.html',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
  styles: [`
    :host {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: #ffffff;
      border-right: 1px solid rgba(0, 0, 0, 0.08);
      user-select: none;
    }
    .sidebar-header {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: #ffffff;
      padding: calc(24px + var(--ion-safe-area-top, env(safe-area-inset-top, 0px))) 20px 24px;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    }
    .header-content {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .logo-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .logo-icon img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .title-wrap h2 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.01em;
    }
    .title-wrap p {
      margin: 2px 0 0 0;
      font-size: 0.78rem;
      color: rgba(255, 255, 255, 0.85);
    }
    .sidebar-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px 12px;
    }
    .nav-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .nav-item {
      --background: transparent;
      --border-radius: 10px;
      --padding-start: 14px;
      --padding-end: 10px;
      --inner-padding-end: 0px;
      --min-height: 48px;
      font-weight: 500;
      color: #4b5563;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .nav-item::part(native) {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }
    .nav-item ion-label {
      flex: 1 1 auto;
      margin-right: 8px;
    }
    .nav-item:hover {
      --background: #f3f4f6;
      color: #1f2937;
    }
    .nav-item.selected-item {
      --background: #eff6ff;
      color: #2563eb;
      font-weight: 600;
      position: relative;
    }
    .nav-item.selected-item::before {
      content: '';
      position: absolute;
      left: 0;
      top: 8px;
      bottom: 8px;
      width: 4px;
      background: #2563eb;
      border-radius: 0 4px 4px 0;
    }
    .nav-icon {
      font-size: 1.25rem;
      color: inherit;
      margin-right: 12px;
    }
    .chevron-icon {
      font-size: 1.05rem;
      opacity: 0.45;
      margin-left: auto;
      flex-shrink: 0;
    }
    .sidebar-footer {
      flex-shrink: 0;
      padding: 16px 16px calc(16px + env(safe-area-inset-bottom, 0px));
      border-top: 1px solid #e5e7eb;
      background: #f8fafc;
    }
    .logout-btn {
      --border-radius: 10px;
      font-weight: 600;
      letter-spacing: 0.01em;
    }
  `]
})
export class AdminSidebarComponent {
  @Output() closeSidebar = new EventEmitter<void>();

  readonly adminPages = [
    { title: 'Dashboard', url: '/admin/dashboard', icon: 'grid' },
    { title: 'Users', url: '/admin/users', icon: 'people' },
    { title: 'Businesses', url: '/admin/businesses', icon: 'business' },
    { title: 'Offers/Deals', url: '/admin/offers', icon: 'pricetags' },
    { title: 'Notifications', url: '/admin/notifications', icon: 'notifications' },
    { title: 'Analytics', url: '/admin/analytics', icon: 'bar-chart' },
  ];

  private readonly authSession = inject(AuthSessionService);

  constructor(private router: Router) {
    addIcons({
      gridOutline,
      peopleOutline,
      businessOutline,
      pricetagsOutline,
      barChartOutline,
      settingsOutline,
      notificationsOutline,
      logOutOutline,
      chevronForwardOutline
    });
  }

  onItemClick(): void {
    this.closeSidebar.emit();
  }

  async logout(): Promise<void> {
    this.closeSidebar.emit();
    await this.authSession.logout(true);
  }
}
