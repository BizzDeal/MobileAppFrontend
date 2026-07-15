import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule, NavigationEnd, NavigationStart } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { StatusBarService } from './core/platform/statusbar.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
  ],
})
export class AppComponent implements OnInit, OnDestroy {
  isAdminRoute = false;
  private routerSub!: Subscription;

  constructor(
    private router: Router,
    private statusBarService: StatusBarService
  ) {}

  ngOnInit(): void {
    this.statusBarService.initialize();
    this.requestMediaPermissions();
    this.updateRouteState(this.router.url);

    this.routerSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationStart || e instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event instanceof NavigationStart ? event.url : event.urlAfterRedirects;
        this.updateRouteState(url);
      });
  }

  private async requestMediaPermissions(): Promise<void> {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Request both audio and video permissions
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        // Immediately stop the tracks so the camera/mic indicator turns off
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (err) {
      console.log('Media permissions not granted or not supported initially.', err);
    }
  }

  private updateRouteState(url: string = ''): void {
    const isAdmin = url ? url.startsWith('/admin') : false;
    this.isAdminRoute = isAdmin;
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }
}
