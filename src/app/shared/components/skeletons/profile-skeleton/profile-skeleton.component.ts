import { Component } from '@angular/core';

import { IonSkeletonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-profile-skeleton',
  standalone: true,
  imports: [IonSkeletonText],
  templateUrl: './profile-skeleton.component.html',
  styleUrl: './profile-skeleton.component.scss'
})
export class ProfileSkeletonComponent {}
