import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-my-business',
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar],
  template: `
    <ion-header mode="ios">
      <ion-toolbar>
        <ion-title>My Business</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; color: var(--bizzdeal-color-text-light);">
        <h2>Coming Soon</h2>
        <p>Manage your business listings and offers here.</p>
      </div>
    </ion-content>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyBusinessComponent {}
