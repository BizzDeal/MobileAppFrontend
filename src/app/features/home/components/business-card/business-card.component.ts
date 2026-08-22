import { ChangeDetectionStrategy, Component, input, output, OnInit, OnDestroy, signal, inject, ElementRef } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForwardOutline, locationOutline, starOutline, ribbonOutline } from 'ionicons/icons';
import { BusinessDTO } from '../../models/home.model';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { getInitials, getAvatarColor } from '../../../../shared/utils/avatar.util';
import { SafeVideoPipe } from '../../../../shared/pipes/safe-video.pipe';

@Component({
  selector: 'app-business-card',
  standalone: true,
  imports: [IonIcon, CachedImgDirective, SafeVideoPipe],
  templateUrl: './business-card.component.html',
  styleUrl: './business-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessCardComponent implements OnInit, OnDestroy {
  readonly business = input.required<BusinessDTO>();
  readonly businessClick = output<BusinessDTO>();
  
  readonly isVisible = signal(false);
  private observer: IntersectionObserver | null = null;
  private readonly el = inject(ElementRef);
  
  constructor() {
    addIcons({ starOutline, locationOutline, arrowForwardOutline, ribbonOutline });
  }

  ngOnInit() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.isVisible.set(true);
          if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
          }
        }
      });
    }, { threshold: 0.1 });
    
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  getInitials(name?: string | null): string {
    return getInitials(name);
  }

  getAvatarColor(name?: string | null): string {
    return getAvatarColor(name);
  }
}
