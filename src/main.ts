import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { PreloadAllModules, RouteReuseStrategy, provideRouter, withPreloading } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { inject, provideAppInitializer } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { adminRegionFilterInterceptor } from './app/core/interceptors/admin-region-filter.interceptor';
import { loadingInterceptor } from './app/core/interceptors/loading.interceptor';
import { apiMessageInterceptor } from './app/core/interceptors/api-message.interceptor';
import { AuthSessionService } from './app/core/services/auth-session.service';
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideHttpClient(withInterceptors([authInterceptor, adminRegionFilterInterceptor, loadingInterceptor, apiMessageInterceptor])),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    provideAppInitializer(() => {
      const authSession = inject(AuthSessionService);
      return authSession.initSession();
    }),
  ],
});
