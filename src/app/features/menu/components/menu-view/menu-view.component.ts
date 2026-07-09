import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-menu-view',
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar],
  template: `
    <ion-header class="ion-no-border premium-header">
      <ion-toolbar>
        <ion-title>Menu</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; color: var(--bizzdeal-color-text-light);">
        <h2>Coming Soon</h2>
        <p>Additional settings and tools for your business will appear here.</p>
      </div>
    </ion-content>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuViewComponent {}
