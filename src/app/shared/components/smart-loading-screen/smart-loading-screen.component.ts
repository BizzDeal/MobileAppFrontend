import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-smart-loading-screen',
  templateUrl: './smart-loading-screen.component.html',
  styleUrls: ['./smart-loading-screen.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class SmartLoadingScreenComponent {
  isLoading$: Observable<boolean>;

  constructor(private loadingService: LoadingService) {
    this.isLoading$ = this.loadingService.isLoading$;
  }
}
