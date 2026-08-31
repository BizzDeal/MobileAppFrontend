import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { menuOutline } from 'ionicons/icons';

@Component({
  selector: 'app-menu-view',
  standalone: true,
  imports: [IonIcon],
  template: `
    <div class="menu-page">
      <div class="app-page-header">
        <div class="header-brand-group">
          <div class="header-icon-badge">
            <ion-icon name="menu-outline"></ion-icon>
          </div>
          <div class="header-title-group">
            <h2 class="header-title">MENU</h2>
            <p class="header-subtitle">Access additional settings and tools</p>
          </div>
        </div>
      </div>
      <div class="menu-body">
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; color: var(--bizzdeal-text-secondary, #64748b); padding: 48px 16px;">
          <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Coming Soon</h2>
          <p style="font-size: 0.9rem;">Additional settings and tools for your business will appear here.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .menu-page {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--bizzdeal-bg-main, #f8fafc);
      overflow-y: auto;
    }
    .app-page-header {
      background: var(--bizzdeal-bg-surface, #ffffff);
      border-bottom: 1px solid var(--bizzdeal-border-color, #e2e8f0);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
      padding: calc(var(--ion-safe-area-top, env(safe-area-inset-top, 0px)) + 8px) 16px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      position: sticky;
      top: 0;
      z-index: 40;
    }
    .header-brand-group {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 0;
    }
    .header-icon-badge {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(30, 136, 229, 0.3);
      flex-shrink: 0;
    }
    .header-icon-badge ion-icon {
      font-size: 1.35rem;
    }
    .header-title-group {
      flex: 1;
      min-width: 0;
    }
    .header-title {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .header-subtitle {
      margin: 2px 0 0;
      font-size: 0.78rem;
      color: #64748b;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .menu-body {
      padding: 16px 16px calc(90px + env(safe-area-inset-bottom, 0px));
      flex: 1;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuViewComponent {
  constructor() {
    addIcons({ menuOutline });
  }
}
