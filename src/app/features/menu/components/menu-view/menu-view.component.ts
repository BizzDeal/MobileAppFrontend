import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { menuOutline } from 'ionicons/icons';

@Component({
  selector: 'app-menu-view',
  standalone: true,
  imports: [IonContent, IonIcon],
  template: `
    <ion-content class="ion-padding">
      <div class="page-top-header">
        <div class="header-content">
          <div class="header-icon-box">
            <ion-icon name="menu-outline"></ion-icon>
          </div>
          <div class="header-text">
            <h2>Menu</h2>
            <p>Access additional settings and tools.</p>
          </div>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; color: var(--bizzdeal-color-text-light);">
        <h2>Coming Soon</h2>
        <p>Additional settings and tools for your business will appear here.</p>
      </div>
    </ion-content>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuViewComponent {
  constructor() {
    addIcons({ menuOutline });
  }
}
