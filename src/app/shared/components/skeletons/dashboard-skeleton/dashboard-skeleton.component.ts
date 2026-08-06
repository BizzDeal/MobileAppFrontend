import { Component } from '@angular/core';

import { IonSkeletonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-dashboard-skeleton',
  standalone: true,
  imports: [IonSkeletonText],
  templateUrl: './dashboard-skeleton.component.html',
  styleUrl: './dashboard-skeleton.component.scss'
})
export class DashboardSkeletonComponent {}
