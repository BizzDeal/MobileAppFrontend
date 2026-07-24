import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonSkeletonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-card-skeleton',
  standalone: true,
  imports: [CommonModule, IonCard, IonSkeletonText],
  templateUrl: './card-skeleton.component.html',
  styleUrl: './card-skeleton.component.scss'
})
export class CardSkeletonComponent implements OnChanges {
  @Input() count: number = 3;
  
  countArray: number[] = [];

  ngOnChanges(): void {
    this.countArray = Array.from({ length: this.count }, (_, i) => i);
  }
}
