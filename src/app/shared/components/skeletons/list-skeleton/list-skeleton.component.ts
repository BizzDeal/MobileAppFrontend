import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonSkeletonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-list-skeleton',
  standalone: true,
  imports: [CommonModule, IonSkeletonText],
  templateUrl: './list-skeleton.component.html',
  styleUrl: './list-skeleton.component.scss'
})
export class ListSkeletonComponent implements OnChanges {
  @Input() count: number = 4;
  
  countArray: number[] = [];

  ngOnChanges(): void {
    this.countArray = Array.from({ length: this.count }, (_, i) => i);
  }
}
