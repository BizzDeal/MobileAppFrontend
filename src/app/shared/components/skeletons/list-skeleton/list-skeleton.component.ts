import { Component, Input, OnChanges, OnInit } from '@angular/core';

import { IonSkeletonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-list-skeleton',
  standalone: true,
  imports: [IonSkeletonText],
  templateUrl: './list-skeleton.component.html',
  styleUrl: './list-skeleton.component.scss'
})
export class ListSkeletonComponent implements OnChanges, OnInit {
  @Input() count: number = 4;
  
  countArray: number[] = [];

  ngOnInit(): void {
    if (this.countArray.length === 0) {
      this.countArray = Array.from({ length: this.count }, (_, i) => i);
    }
  }

  ngOnChanges(): void {
    this.countArray = Array.from({ length: this.count }, (_, i) => i);
  }
}
