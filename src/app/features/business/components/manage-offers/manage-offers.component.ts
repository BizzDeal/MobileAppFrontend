import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-manage-offers',
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar],
  template: `
    <ion-header mode="ios">
      <ion-toolbar>
        <ion-title>My Offers</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; color: var(--bizzdeal-text-secondary);">
        <h2>Offers Management</h2>
        <p>Create and track the performance of your offers here.</p>
      </div>
    </ion-content>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManageOffersComponent {}
