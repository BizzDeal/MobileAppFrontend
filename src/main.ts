import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { PreloadAllModules, RouteReuseStrategy, provideRouter, withPreloading } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { inject, provideAppInitializer } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';

// Fix for ApexCharts and third-party libraries calling e.preventDefault() inside touch/wheel event listeners.
// Browsers treat touchstart, touchmove, wheel, and mousewheel listeners as passive by default unless explicit passive: false is specified.
const originalAddEventListener = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function (
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions
) {
  if (['touchstart', 'touchmove', 'mousewheel', 'wheel'].includes(type)) {
    if (typeof options === 'object' && options !== null) {
      if (options.passive === undefined) {
        options = { ...options, passive: false };
      }
    } else if (options === undefined || typeof options === 'boolean') {
      options = { capture: !!options, passive: false };
    }
  }
  return originalAddEventListener.call(this, type, listener, options);
};

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { adminRegionFilterInterceptor } from './app/core/interceptors/admin-region-filter.interceptor';
import { loadingInterceptor } from './app/core/interceptors/loading.interceptor';
import { apiMessageInterceptor } from './app/core/interceptors/api-message.interceptor';
import { splashScreenInterceptor } from './app/core/interceptors/splash-screen.interceptor';
import { AuthSessionService } from './app/core/services/auth-session.service';
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideHttpClient(withInterceptors([apiMessageInterceptor, splashScreenInterceptor, authInterceptor, adminRegionFilterInterceptor, loadingInterceptor])),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    provideAppInitializer(() => {
      const authSession = inject(AuthSessionService);
      return authSession.initSession();
    }),
  ],
});
