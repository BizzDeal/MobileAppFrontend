// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,

  apiUrl: 'http://192.168.0.170:3000/bizzdeal/api',
  firebaseConfig: {
    apiKey: 'AIzaSyBp9WgJDnBHZfrV0wLn117cAFqu-SiOyFo',
    authDomain: 'bizzdeal.firebaseapp.com',
    projectId: 'bizzdeal',
    storageBucket: 'bizzdeal.firebasestorage.app',
    messagingSenderId: '733354093584',
    appId: '1:733354093584:web:7c509cd64322de17422e95',
    measurementId: 'G-5EFJPYW1HD',
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
