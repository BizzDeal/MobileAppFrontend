import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonSkeletonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-profile-skeleton',
  standalone: true,
  imports: [CommonModule, IonSkeletonText],
  templateUrl: './profile-skeleton.component.html',
  styleUrl: './profile-skeleton.component.scss'
})
export class ProfileSkeletonComponent {}
