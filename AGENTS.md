# AGENTS.md — BizzDeal Frontend

## 1. Project Purpose

BizzDeal Frontend is a mobile-first application built with Angular and Ionic.

The primary target is a native Android/iOS application through Capacitor, but the application must also build and run cleanly on the web. **Always take care of both mobile and web compatibility at the same time during development, while maintaining mobile as the primary priority.**

This document defines mandatory rules for AI coding agents and developers working on the BizzDeal frontend.

The goals are:

- Keep the application modular.
- Keep features independent.
- Avoid duplicated code.
- Keep native platform logic isolated.
- Keep API integration predictable.
- Make future changes easy.
- Prefer simple solutions over unnecessary architecture.

---

## 2. Core Stack

Use the existing project versions. Do not upgrade packages unless explicitly requested.

Primary stack:

- Angular
- TypeScript
- Ionic Angular
- Capacitor
- Angular Router
- Angular HttpClient
- Angular Signals
- RxJS
- Reactive Forms
- Firebase/FCM where required for push notifications

Do not introduce new state-management, UI, utility, or networking libraries without a clear requirement.

### Do not add by default

- NgRx
- Redux
- Tailwind
- Bootstrap
- Axios
- Lodash
- Moment.js
- jQuery

Use Angular and Ionic capabilities first.

---

## 3. General Agent Behaviour

Before changing code:

1. Inspect the relevant feature.
2. Inspect existing reusable components.
3. Inspect existing models and API services.
4. Inspect routing related to the feature.
5. Follow existing project conventions.
6. Make the smallest correct change.

Never rewrite a working feature only to match a preferred coding style.

Never perform unrelated refactoring while implementing a requested feature.

Never create duplicate services, models, utilities, or components.

Search the codebase before creating a new shared abstraction.

When requirements are incomplete, use the existing backend contract and project patterns as the source of truth.

Do not invent API fields, response structures, enum values, routes, business rules, reward calculations, or user permissions.

After changing code:

1. **Always check for build and typescript errors**: When finishing an implementation, you MUST verify that there are no active build, compilation, or TypeScript errors before marking the task as complete. Do not assume the build succeeded without checking the terminal output or running a build command.
---

## 4. Architecture

Use a feature-first architecture.

Recommended structure:

```text
src/
├── app/
│   ├── core/
│   │   ├── api/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── services/
│   │   ├── storage/
│   │   ├── platform/
│   │   └── constants/
│   │
│   ├── shared/
│   │   ├── components/
│   │   ├── directives/
│   │   ├── pipes/
│   │   ├── models/
│   │   ├── utils/
│   │   └── validators/
│   │
│   ├── features/
│   │   ├── auth/
│   │   ├── home/
│   │   ├── profile/
│   │   ├── businesses/
│   │   ├── deals/
│   │   ├── rewards/
│   │   ├── chat/
│   │   ├── meetings/
│   │   └── notifications/
│   │
│   ├── layouts/
│   ├── app.component.ts
│   ├── app.config.ts
│   └── app.routes.ts
│
├── environments/
├── theme/
└── global.scss
```

Adjust feature names only when the actual BizzDeal requirement or backend API uses different terminology.

### Core

`core/` contains application-wide infrastructure.

Examples:

- Authentication service
- API configuration
- HTTP interceptors
- Route guards
- Token storage
- Platform detection
- Push notification integration
- Global error handling

A feature-specific service must not be placed in `core/`.

### Shared

`shared/` contains reusable UI and reusable framework-independent helpers.

A component belongs in `shared/components/` only when it is genuinely reused by multiple features.

Do not move one-use components into `shared/`.

### Features

Every business feature must live inside `features/<feature-name>/`.

A feature should own its:

- Pages
- Components
- Services
- Models
- Routes
- State
- Mappers

Example:

```text
features/deals/
├── pages/
│   ├── deals-list/
│   └── deal-details/
├── components/
│   └── deal-card/
├── services/
│   └── deals.service.ts
├── models/
│   └── deal.model.ts
├── state/
│   └── deals.store.ts
└── deals.routes.ts
```

Do not import internal files directly from another feature unless there is a strong architectural reason.

Move genuinely reusable logic to `shared/` or `core/`.

---

## 5. Angular Rules

Use standalone components.

Do not create NgModules unless integration with an existing dependency specifically requires one.

Use:

```ts
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [],
  templateUrl: './example.component.html',
  styleUrl: './example.component.scss',
})
export class ExampleComponent {}
```

Prefer `inject()` for dependency injection.

Example:

```ts
private readonly dealsService = inject(DealsService);
private readonly router = inject(Router);
```

Keep injected dependencies `private readonly` unless the template requires direct access.

Prefer Angular built-in template control flow:

```html
@if (loading()) {
  <ion-spinner />
}

@for (deal of deals(); track deal.id) {
  <app-deal-card [deal]="deal" />
}
```

Avoid introducing new `*ngIf` and `*ngFor` usage in new code unless required by an existing compatibility constraint.

Always provide a meaningful tracking expression for repeated lists.

Use `ChangeDetectionStrategy.OnPush` for reusable presentational components.

Keep component classes focused on UI orchestration.

Do not put complex business logic directly in page components.

---

## 6. Components and Pages

Ionic routed screens are pages.

Reusable UI pieces are components.

Examples:

```text
deal-details.page.ts
deal-card.component.ts
reward-badge.component.ts
```

A page may:

- Read route parameters.
- Call feature services or stores.
- Coordinate page state.
- Open Ionic overlays.
- Navigate.
- Pass data to child components.

A page should not:

- Build API URLs.
- Directly access local storage.
- Contain reward calculation rules.
- Parse JWT tokens manually.
- Directly initialize Firebase.
- Directly call native plugins throughout the component.
- Duplicate backend models.
- Contain complex business logic or state management directly; push all logic and state manipulation into services (using signals). If no global state management is needed, provide/inject a dedicated local service directly into the component to keep it lean and simple.

Prefer small components.

When a template becomes difficult to understand, extract meaningful UI sections.

Do not split a component only to reduce line count.

Every extracted component must have a clear responsibility.

---

## 7. File Size and Responsibility

Use one main responsibility per file.

As a guideline:

- Components/pages should normally remain below 250 lines of TypeScript.
- Services should normally remain below 300 lines.
- Utility files should remain focused on one domain.

These are review signals, not reasons for mechanical file splitting.

If a file becomes large because it performs unrelated jobs, split by responsibility.

Never create files such as:

```text
helpers.ts
common.ts
utils.ts
functions.ts
```

with unrelated logic inside them.

Use descriptive names:

```text
date-format.util.ts
phone-number.validator.ts
deal-status.mapper.ts
```

---

## 8. State Management

Do not add NgRx by default.

Use Angular Signals for local and feature state.
- **Service-Driven State & Lean Components**: Always use services for state management using signals. Keep business logic and state transitions in services. If no global state management is needed for a page or screen, create a local service and inject it directly into the component. Keep components lean and simple by pushing all logic and state management to services (global or local) as much as possible.

Use RxJS for asynchronous streams and HttpClient operations.

Use a feature store service when multiple pages/components need the same feature state.

Example:

```ts
@Injectable({
  providedIn: 'root',
})
export class DealsStore {
  private readonly _deals = signal<Deal[]>([]);
  private readonly _loading = signal(false);

  readonly deals = this._deals.asReadonly();
  readonly loading = this._loading.asReadonly();

  setDeals(deals: Deal[]): void {
    this._deals.set(deals);
  }

  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }
}
```

Do not expose writable signals publicly.

Use `computed()` for derived state.

Do not store the same state in multiple components.

Do not add a global store for simple page state.

Examples of local state:

- Modal open/closed
- Selected tab
- Form visibility
- Page loading state used only by one page

Examples of feature/shared state:

- Current authenticated user
- Notification unread count
- Active conversation
- Cached deal list shared by multiple screens

---

## 9. RxJS Rules

Use RxJS where streams are appropriate.

Never create nested subscriptions.

Bad:

```ts
this.userService.getUser().subscribe(user => {
  this.dealsService.getDeals(user.id).subscribe(deals => {
    // ...
  });
});
```

Use RxJS operators instead.

Prefer:

- `switchMap`
- `map`
- `tap`
- `filter`
- `catchError`
- `finalize`

Use `takeUntilDestroyed()` for manual subscriptions tied to Angular lifecycle.

Do not use `Subject<void>` only to implement component destruction in new Angular code.

Do not subscribe inside services just to return the result later.

Services should normally return an `Observable`.

---

## 10. API Integration

All HTTP calls must be made through Angular `HttpClient`.

Feature API calls belong in feature services.

Example:

```ts
@Injectable({
  providedIn: 'root',
})
export class DealsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  getDeals(): Observable<Deal[]> {
    return this.http.get<Deal[]>(`${this.apiUrl}/deals`);
  }
}
```

Never hardcode the BizzDeal backend domain inside components or feature services.

Bad:

```ts
this.http.get('https://bizz-deal.onrender.com/...');
```

Use environment/configuration-based API setup.

Keep the backend base URL in one location.

Use an HTTP interceptor for authentication headers.

Use an HTTP interceptor for shared HTTP error handling only where the handling is genuinely global.

Do not show the same error twice from both an interceptor and a component.

Do not add `Authorization` headers manually to every API call.

### API models

Create TypeScript interfaces or types that reflect the real backend contract.

Example:

```ts
export interface Deal {
  id: string;
  title: string;
  description: string | null;
  status: DealStatus;
}
```

Do not use `any`.

Do not invent fields to make the UI easier.

Create a UI view model or mapper when the API model and display model differ.

Example:

```text
deal-api.model.ts
deal-view.model.ts
deal.mapper.ts
```

Keep DTO naming consistent with the backend where useful.

---

## 11. API Response Handling

Do not assume every successful API response is the final data object.

Inspect the backend response contract.

If BizzDeal uses a shared response wrapper, model it once.

Example:

```ts
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
```

Use a shared model instead of recreating the wrapper in every feature.

Do not silently ignore backend errors.

Display user-friendly messages.

Never display raw stack traces, SQL errors, or internal backend error details to users.

Log technical details only through the project's logging strategy.

---

## 12. Authentication and OTP

Authentication logic belongs in the auth feature and core authentication infrastructure.

Recommended responsibilities:

```text
features/auth/
├── pages/
│   ├── phone-login/
│   └── verify-otp/
├── services/
│   └── auth-api.service.ts
├── models/
│   └── auth.model.ts
└── auth.routes.ts

core/
├── guards/
│   └── auth.guard.ts
├── interceptors/
│   └── auth.interceptor.ts
└── services/
    └── auth-session.service.ts
```

The UI must not generate or validate OTPs locally.

OTP verification must follow the actual backend/Firebase authentication flow.

Do not treat a phone number as authenticated until authentication is successfully verified.

The authentication session service owns session state.

Do not read tokens independently from multiple pages.

Do not decode a JWT to implement authorization unless the backend contract explicitly uses token claims for that purpose.

Route protection belongs in guards.

---

## 13. Token and Local Storage

Create a storage abstraction.

Example:

```text
core/storage/
├── storage.service.ts
└── storage.keys.ts
```

Pages and UI components must not directly call:

```ts
localStorage.getItem(...)
localStorage.setItem(...)
```

Do not scatter storage key strings through the application.

Use constants.

Example:

```ts
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;
```

Store only data that must persist.

Do not persist large API response objects without an explicit offline/caching requirement.

Do not store sensitive values unnecessarily.

Never log access tokens, refresh tokens, Firebase tokens, OTPs, or credentials.

---

## 14. Ionic UI Rules

Use Ionic components for primary mobile UI where appropriate.

Examples:

- `ion-header`
- `ion-toolbar`
- `ion-content`
- `ion-list`
- `ion-item`
- `ion-button`
- `ion-input`
- `ion-modal`
- `ion-alert`
- `ion-toast`
- `ion-loading`
- `ion-refresher`
- `ion-infinite-scroll`

Do not rebuild standard mobile controls with custom HTML/CSS without a clear design requirement.

Use Ionic overlays through a small reusable service when the same behavior is used across features.

Examples:

```text
toast.service.ts
loading.service.ts
alert.service.ts
```

Do not duplicate toast creation code in every page.

Use semantic Ionic color variables and project theme variables defined in `src/theme/variables.scss`.

**Mandatory Color System & Theme Rules:**
- **Default Light Theme**: The application uses Light Theme by default across all platforms and web builds (`dark.class.css`). Do not use system-dependent dark mode (`dark.system.css`) or force dark mode unless explicitly toggled by user preference via `.ion-palette-dark`.
- All features, pages, modals, and components across the entire application MUST strictly adhere to the BizzDeal Design System defined in `src/theme/variables.scss` and `src/global.scss`.
- **Primary Aesthetic**: Use the BizzDeal signature vibrant blue gradient (`--bizzdeal-gradient-primary`) with soft blue elevation glow (`--bizzdeal-shadow-primary`) for primary actions, CTA buttons, and featured icons/badges.
- **Surface & Shape Tokens**: Use large, friendly border radii (`--bizzdeal-radius-xl` / `26px` for cards and modals, `--bizzdeal-radius-md` / `14px` for buttons and inputs) and clean elevation shadows (`--bizzdeal-shadow-md` / `--bizzdeal-shadow-lg`).
- **Typography & Colors**: The entire application uses **Roboto** (`--bizzdeal-font-family` / `--ion-font-family`) as the mandatory font. Always use `--bizzdeal-text-primary` for headings, `--bizzdeal-text-secondary` for body/descriptions, and `--bizzdeal-text-link` for links.
- **No Hardcoding**: Never hardcode hex codes, RGB values, arbitrary box-shadows, or custom border-radii in individual component stylesheets. Always reference `--bizzdeal-*` and `--ion-color-*` tokens or `.bd-*` utility classes.

---

## 15. Styling

Keep global styles minimal.

Use:

```text
src/theme/variables.scss
src/global.scss
```

for application-wide theming and genuine global rules.

Keep feature/component-specific styles in the component SCSS file.

Use CSS variables for repeated design values defined in `src/theme/variables.scss`.

Example:

```scss
:root {
  --bizzdeal-gradient-primary: linear-gradient(90deg, #1565C0 0%, #2196F3 100%);
  --bizzdeal-card-radius: 26px;
  --bizzdeal-button-radius: 14px;
  --bizzdeal-shadow-primary: 0 6px 20px rgba(33, 150, 243, 0.35);
}
```

Do not use inline styles.

Do not use `!important` unless overriding third-party/Ionic behavior is unavoidable and the reason is documented.

Use responsive layouts.

Do not design only for one Android screen size.

Respect safe areas.

Avoid fixed heights for primary screen content unless required.

Do not use excessive absolute positioning for normal layout.

---

## 16. Mobile-First UX & Web Compatibility

BizzDeal is mobile-first, but must support web builds simultaneously. While mobile UX and native feel are the primary priority, always ensure that features, layouts, and components work seamlessly and build without errors on the web at the same time.

Every page must consider:

- Small screens
- Large phones
- Keyboard visibility
- Safe areas
- Touch targets
- Loading states
- Empty states
- Error states
- Slow networks

Buttons and interactive elements must be easy to tap.

Do not hide critical actions behind hover interactions.

Do not assume a mouse or physical keyboard.

Forms must remain usable when the mobile keyboard is open.

- **No Layout Shift on Form Validation**: Never allow form error messages or validation text to cause layout shifts or screen glitching by pushing down buttons and surrounding elements. Always reserve fixed vertical space (e.g., using `min-height` on an error wrapper container) so that UI elements never jump or move when validation errors appear or disappear.

Long lists should use appropriate pagination, infinite scroll, or backend-supported loading behavior.

Do not fetch an unlimited dataset simply because the initial dataset is small.

---

## 17. Platform-Specific Logic

Do not scatter platform checks across pages.

Bad:

```ts
if (Capacitor.getPlatform() === 'android') {
  // ...
}
```

repeated across the application.

Create a platform service.

Example:

```ts
@Injectable({
  providedIn: 'root',
})
export class PlatformService {
  readonly platform = Capacitor.getPlatform();
  readonly isNative = Capacitor.isNativePlatform();

  isAndroid(): boolean {
    return this.platform === 'android';
  }

  isIos(): boolean {
    return this.platform === 'ios';
  }

  isWeb(): boolean {
    return this.platform === 'web';
  }
}
```

Native functionality must be wrapped by a service.

Examples:

```text
core/platform/
├── platform.service.ts
├── push-notification.service.ts
├── camera.service.ts
├── geolocation.service.ts
└── app-lifecycle.service.ts
```

Pages consume these services.

Pages must not directly contain complex Capacitor plugin logic.

When native and web implementations differ significantly, expose one application-facing interface.

Example:

```ts
export interface NotificationPermissionService {
  requestPermission(): Promise<boolean>;
}
```

Keep platform differences behind the implementation. Always ensure web fallbacks or clean no-op handling are present so that web builds and functionality never fail due to mobile-only native plugins.

---

## 18. Capacitor Plugin Rules

Before adding a Capacitor plugin:

1. Confirm the feature needs native access.
2. Check whether the project already has a wrapper service.
3. Use the existing Capacitor major version.
4. Verify Android and iOS configuration requirements.
5. Handle permission denial.
6. Handle unavailable functionality.
7. Define web fallback behavior when the web app supports the feature.

Never assume permission is granted.

Never repeatedly request denied permissions on every page load.

Do not call plugins before application/platform initialization where initialization is required.

Do not put native configuration secrets in frontend source code.

---

## 19. Push Notifications and FCM

Push notification code belongs in a dedicated notification infrastructure service.

Recommended structure:

```text
core/platform/
└── push-notification.service.ts

features/notifications/
├── pages/
│   └── notifications-list/
├── services/
│   └── notifications.service.ts
├── models/
│   └── notification.model.ts
└── state/
    └── notifications.store.ts
```

Separate these responsibilities:

### PushNotificationService

Responsible for:

- Notification permission
- Native push registration
- FCM/native device token events
- Foreground notification events
- Notification tap events
- Platform-specific notification setup

### NotificationsService

Responsible for:

- BizzDeal notification APIs
- Fetch notification history
- Mark as read
- Mark all as read
- Synchronize device registration with the backend when required

### NotificationsStore

Responsible for:

- Notification list state
- Unread count
- Loading state
- Read-state updates

Do not use the FCM token as a user identifier.

Send device token registration data to the BizzDeal backend using the actual `user_devices` API contract.

Handle token changes.

Do not log push tokens in production.

Notification tap routing must validate the notification payload.

Do not navigate to arbitrary routes supplied by an untrusted payload.

Map supported notification types to known application routes.

Example:

```ts
const notificationRoutes: Record<NotificationType, string> = {
  DEAL_CREATED: '/deals',
  CHAT_MESSAGE: '/chat',
  MEETING_CREATED: '/meetings',
};
```

Use the actual backend enum values. Do not invent notification types.

---

## 20. Routing

Use Angular Router and Ionic routing patterns.

Keep root routes small.

Feature routes should be lazy loaded.

Example:

```ts
{
  path: 'deals',
  loadChildren: () =>
    import('./features/deals/deals.routes').then(
      routes => routes.DEALS_ROUTES,
    ),
}
```

Feature routes:

```ts
export const DEALS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/deals-list/deals-list.page').then(
        page => page.DealsListPage,
      ),
  },
  {
    path: ':dealId',
    loadComponent: () =>
      import('./pages/deal-details/deal-details.page').then(
        page => page.DealDetailsPage,
      ),
  },
];
```

Use route constants only when they reduce real duplication.

Do not create an overengineered route-builder system.

Validate route parameters before API usage.

Do not assume a route ID exists.

Use guards for authentication and permission-based navigation.

Do not use guards as the only security mechanism. Backend authorization remains authoritative.

---

## 21. Ionic Page Lifecycle

Do not assume `ngOnInit()` runs every time the user navigates back to an Ionic page.

Use Angular lifecycle hooks for component initialization.

Use Ionic page lifecycle hooks when page-enter/page-leave behavior is specifically required.

Examples:

- Refreshing page data every time the page becomes active
- Starting/stopping page-specific behavior
- Updating unread state after returning to a page

Do not reload every API on every `ionViewWillEnter()` without a reason.

Choose the lifecycle based on the feature requirement.

---

## 22. Forms

Use Angular Reactive Forms for business forms.

Do not use manual DOM reads.

Bad:

```ts
const phone = document.getElementById('phone');
```

Use:

- `FormControl`
- `FormGroup`
- Typed forms
- Validators
- Custom validators when reusable

Example:

```ts
readonly form = new FormGroup({
  phoneNumber: new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  }),
});
```

Keep validation rules reusable when the same business rule is used by multiple forms.

Do not duplicate validation regex patterns.

Display validation errors only when appropriate for the UX.

Disable duplicate submission while a request is processing.

Do not trust frontend validation as backend validation.

---

## 23. Error Handling

Every async feature must consider:

- Loading
- Success
- Empty result
- Recoverable error
- Permission denied where applicable

Do not leave a spinner active after an error.

Use `finalize()` where appropriate.

Example:

```ts
this.loading.set(true);

this.dealsService
  .getDeals()
  .pipe(
    finalize(() => this.loading.set(false)),
  )
  .subscribe({
    next: deals => this.deals.set(deals),
    error: () => this.toastService.error('Unable to load deals.'),
  });
```

User messages should be understandable.

Bad:

```text
Http failure response for /api/deals: 500
```

Better:

```text
Unable to load deals. Please try again.
```

Preserve technical details for debugging without exposing internals to users.

---

## 24. Loading and Duplicate Requests

Prevent accidental duplicate API requests.

Disable submit buttons while submitting.

Use state flags or stream composition where appropriate.

Do not create multiple identical requests from:

- `ngOnInit`
- `ionViewWillEnter`
- Route subscriptions

without checking whether all are required.

For search inputs, debounce requests where appropriate.

Cancel stale search requests with `switchMap`.

---

## 25. Chat Feature Rules

Keep chat isolated as a feature.

Recommended structure:

```text
features/chat/
├── pages/
│   ├── conversations/
│   └── conversation/
├── components/
│   ├── message-bubble/
│   └── message-composer/
├── services/
│   └── chat.service.ts
├── models/
│   └── chat.model.ts
└── state/
    └── chat.store.ts
```

Do not mix conversation-list state with active-conversation state without a clear reason.

Message components should be presentational.

Do not put API calls inside `message-bubble`.

Use stable message IDs for list tracking.

Handle:

- Sending state
- Send failure
- Empty conversation
- Pagination/history loading
- Duplicate messages
- Real-time updates when introduced

Do not implement fake real-time behavior with aggressive API polling unless explicitly required.

Use the backend-supported real-time mechanism.

---

## 26. Meeting Feature Rules

Meeting pages must use the backend as the source of truth for meeting data and attendee state.

Do not calculate authoritative meeting status only from frontend assumptions.

Date/time handling must be explicit.

Store and exchange timestamps according to the backend contract.

Convert timestamps for display at the UI boundary.

Do not manually concatenate date strings.

Use a focused date utility/service when shared formatting is required.

Always consider timezone behavior for meeting display.

---

## 27. Rewards Feature Rules

Do not invent reward points, formulas, expiry rules, redemption conditions, or tiers.

The backend/client-approved business rule is authoritative.

Frontend responsibilities should normally be limited to:

- Display reward balance.
- Display reward history.
- Display eligible reward actions.
- Submit supported redemption/action requests.
- Display backend validation errors clearly.

Do not calculate the authoritative reward balance from transaction history in the frontend unless the contract explicitly requires it.

Do not assume a successful UI animation means a reward was granted.

Wait for backend success.

---

## 28. Images and Files

Do not store binary files in application state longer than needed.

Validate file type and size before upload for user experience.

Backend validation remains authoritative.

Preview object URLs must be revoked when no longer needed.

Do not convert large files to Base64 unless the API explicitly requires Base64.

Use upload progress only when supported and useful.

Handle upload failures and retries clearly.

---

## 29. Environment Configuration

Environment-specific values must not be hardcoded.

Examples:

- API base URL
- Firebase public client configuration where applicable
- Feature flags
- Environment labels

Never commit:

- Service account private keys
- Firebase Admin SDK credentials
- Backend secrets
- Database credentials
- Private API keys

Frontend code is not a secure place for secrets.

Only public client configuration belongs in the frontend.

Do not use `environment.ts` as a secret vault.

---

## 30. Constants and Enums

Use backend-aligned enums for finite domain values.

Example:

```ts
export enum DealStatus {
  Active = 'ACTIVE',
  Expired = 'EXPIRED',
}
```

Use the actual API values.

Do not silently change casing.

Do not duplicate magic strings.

Bad:

```ts
if (status === 'ACTIVE') {}
```

repeated throughout the application.

Prefer a typed enum/type when the value is a domain concept.

Do not create constants for obvious one-use strings.

---

## 31. TypeScript Rules

Strict typing is mandatory.

Do not use:

```ts
any
```

unless interacting with an unavoidable untyped external API and the reason is documented.

Prefer `unknown` for untrusted values.

Narrow `unknown` before use.

Do not use non-null assertions to silence legitimate compiler warnings.

Bad:

```ts
user!.id
```

Fix the state or validate the value.

Use explicit return types for public service methods and complex functions.

Prefer interfaces for object contracts.

Prefer type aliases for unions and composed types.

Avoid unnecessary type duplication.

---

## 32. Naming Rules

Use descriptive names.

### Files

```text
deal-card.component.ts
deals-list.page.ts
deals.service.ts
deals.store.ts
deal.model.ts
auth.guard.ts
auth.interceptor.ts
```

### Classes

```text
DealCardComponent
DealsListPage
DealsService
DealsStore
AuthGuard
```

### Signals

Writable private state:

```ts
private readonly _deals = signal<Deal[]>([]);
```

Public readonly state:

```ts
readonly deals = this._deals.asReadonly();
```

### Booleans

Prefer:

```ts
isLoading
isAuthenticated
hasUnreadNotifications
canRedeem
```

Avoid:

```ts
flag
statusCheck
value1
temp
data
```

when a more specific name is possible.

---

## 33. Functions

Functions should perform one clear operation.

Prefer early returns.

Example:

```ts
openDeal(deal: Deal): void {
  if (!deal.id) {
    return;
  }

  void this.router.navigate(['/deals', deal.id]);
}
```

Avoid functions with many boolean arguments.

Bad:

```ts
loadDeals(true, false, true);
```

Use an options object when multiple modes are necessary.

Do not create generic functions with hidden business behavior.

---

## 34. Comments

Write comments to explain why, not what.

Bad:

```ts
// Set loading to true
this.loading.set(true);
```

Useful:

```ts
// Ionic keeps this page in the navigation stack, so refresh
// the unread count when the page becomes active again.
```

Do not leave commented-out code.

Do not generate large documentation comments for obvious private methods.

Use TODO comments only with a specific reason.

Bad:

```ts
// TODO fix later
```

Better:

```ts
// TODO: Replace polling when the backend chat socket API is available.
```

---

## 35. Accessibility

Accessibility is required.

Use semantic controls.

Do not use clickable `<div>` elements when a button is appropriate.

Provide accessible labels for icon-only buttons.

Example:

```html
<ion-button aria-label="Open notifications">
  <ion-icon name="notifications-outline" />
</ion-button>
```

Images that convey information need meaningful alternative text.

Decorative images should not create screen-reader noise.

Forms need clear labels and understandable validation messages.

Do not rely only on color to communicate status.

---

## 36. Performance

Lazy load feature routes.

Avoid loading all feature data at application startup.

Do not perform heavy calculations in templates.

Use `computed()` for derived signal state.

Use `track` expressions in loops.

Avoid repeated function calls from templates when the result can be represented as state.

Do not optimize blindly.

Measure or identify a real issue before introducing complicated caching.

Images should use sensible sizes for mobile delivery.

Do not repeatedly fetch static reference data if it can safely be cached for the session.

---

## 37. Security Rules

Never trust route parameters, storage values, push payloads, or API data merely because they came from the application.

Validate values before sensitive UI behavior.

The backend remains responsible for real authorization.

Do not hide an unauthorized action only with CSS and treat it as security.

Do not build HTML from user content and bypass Angular sanitization without an explicit reviewed requirement.

Never use unsafe DOM APIs for rendering user-provided content.

Never log:

- OTPs
- Passwords
- Access tokens
- Refresh tokens
- Device tokens
- Private user data unnecessarily

Do not add development backdoors or hardcoded authenticated users.

---

## 38. Testing

Test business-critical and failure-prone behavior.

Prioritize tests for:

- Authentication state
- Auth guards
- HTTP interceptors
- API mapping
- Feature stores
- Validators
- Reward display/business mapping logic
- Notification payload routing
- Platform wrapper behavior
- Critical form submission behavior

Do not write meaningless tests only to increase test count.

Bad test:

```text
should create
```

as the only test for a feature with meaningful behavior.

Mock external boundaries:

- HttpClient
- Capacitor plugins
- Router
- Firebase/native notification integration

Do not call production APIs in unit tests.

E2E/integration testing should use a dedicated test environment when real API validation is required.

---

## 39. Native Plugin Testing

Capacitor plugin access must be abstracted so it can be mocked.

A component should depend on:

```ts
PushNotificationService
```

not directly on a plugin throughout the component.

Test:

- Permission granted
- Permission denied
- Registration success
- Registration failure
- Token received
- Notification received
- Notification tapped
- Unsupported web behavior where relevant

Do not require an Android emulator for ordinary component unit tests.

---

## 40. UI State Pattern

For data-driven pages, prefer explicit page state.

Example:

```ts
readonly deals = signal<Deal[]>([]);
readonly isLoading = signal(false);
readonly errorMessage = signal<string | null>(null);
```

The template must clearly handle loading, error, empty, and data states.

Example:

```html
@if (isLoading()) {
  <app-page-loading />
} @else if (errorMessage()) {
  <app-error-state
    [message]="errorMessage()!"
    (retry)="loadDeals()"
  />
} @else if (deals().length === 0) {
  <app-empty-state message="No deals available." />
} @else {
  @for (deal of deals(); track deal.id) {
    <app-deal-card [deal]="deal" />
  }
}
```

Do not leave a blank screen for empty or failed requests.

---

## 41. Shared UI Components

Create shared components only after identifying real reuse.

Potential BizzDeal shared components may include:

```text
page-loading
empty-state
error-state
user-avatar
status-badge
confirmation-dialog
```

Do not create a universal component with dozens of inputs.

Bad:

```text
universal-card.component.ts
```

with feature flags for deals, rewards, users, chats, and meetings.

Prefer focused components.

---

## 42. Backend Contract Is Authoritative

The BizzDeal NestJS backend is the source of truth for:

- API paths
- DTO fields
- Enum values
- Validation
- Authentication requirements
- Permission rules
- Pagination contract
- Reward rules
- Notification types
- Chat behavior
- Meeting behavior

Before implementing an API feature, inspect the Swagger/OpenAPI contract or confirmed backend DTO.

Do not infer endpoint paths from table names.

Do not infer DTOs from database entities.

Frontend models should follow the public API contract, not the database schema.

---

## 43. Swagger/OpenAPI Integration Workflow

When implementing a backend-connected feature:

1. Identify the endpoint.
2. Confirm HTTP method.
3. Confirm authentication requirement.
4. Confirm request DTO.
5. Confirm response type.
6. Confirm error responses.
7. Create/update the frontend model.
8. Implement the feature service.
9. Implement state handling.
10. Connect the page/component.
11. Handle loading, empty, and error states.
12. Add meaningful tests.

Never start by designing fake frontend data structures when the API already exists.

Mock data may be used for isolated UI development, but it must be clearly separated and removable.

---

## 44. Git and Change Scope

Keep changes focused.

Do not modify unrelated files.

Do not run formatting that rewrites the entire repository unless explicitly requested.

Do not change package versions as part of an unrelated feature.

Do not delete existing code without checking references.

Before completing work:

- Review changed files.
- Remove unused imports.
- Remove debug logs.
- Remove commented code.
- Run type checking/build.
- Run relevant tests.
- Confirm no secrets were added.

---

## 45. Console Logging

Do not leave random logs.

Forbidden in completed feature code:

```ts
console.log('here');
console.log(data);
console.log(token);
```

Temporary debugging logs must be removed.

Never log authentication or notification tokens.

Use a centralized logger only if the project introduces one.

---

## 46. Dependency Rules

Before installing a package, verify:

1. Angular/Ionic/Capacitor cannot already solve the requirement cleanly.
2. The dependency is actively compatible with the existing project versions.
3. It does not duplicate an installed package.
4. The feature genuinely needs it.

Do not install a package for a tiny utility function.

Do not upgrade Angular, Ionic, or Capacitor as a side effect.

After adding a Capacitor plugin, update native projects using the project's established Capacitor workflow.

---

## 47. Agent Implementation Checklist

For every task, the coding agent must ask itself:

### Architecture

- Which feature owns this code?
- Does an existing service/component already solve part of it?
- Am I putting feature logic in `shared` or `core` incorrectly?

### API

- Did I inspect the real backend contract?
- Am I using the correct DTO fields?
- Did I avoid `any`?
- Did I handle backend errors?

### Mobile & Web Compatibility

- Does this work on a small screen (mobile priority)?
- Does the code build and function cleanly on the web at the same time?
- Does the keyboard affect the form?
- Is this touch-friendly?
- Does native functionality have denied/unavailable or web fallback handling?

### State

- Is this local state or shared state?
- Am I duplicating state?
- Do I really need a new store?
- Did I push state management and business logic into services (using signals) to keep the component lean and simple?

### Styling & Theme System

- Did I strictly use `--bizzdeal-*` and `--ion-color-*` variables instead of hardcoded colors or shadows?
- Does the UI match the BizzDeal signature aesthetic (vibrant blue gradient, generous rounded corners, soft elevation glow)?
- Are font sizes, weights, and text colors using semantic design tokens?
- Did I reserve space for form validation errors so no layout shift or screen glitching occurs?

### Quality

- Are loading, empty, success, and error states handled?
- Did I remove debug code?
- Did I avoid unrelated refactoring?
- Did I run relevant tests/build checks?
- Did I check the final code for build or import errors at the end and fix any issues found?

---

## 48. Agent Response Requirements

When completing a coding task, report:

1. What changed.
2. Important architectural decisions.
3. Files created.
4. Files modified.
5. Tests/build checks performed.
6. Any backend dependency or unresolved contract issue.

Keep the report factual.

Do not claim a test passed unless it was actually run.

Do not claim native Android/iOS behavior was verified unless it was tested on the relevant platform.

Example:

```text
Implemented the notification registration flow.

Created:
- core/platform/push-notification.service.ts
- features/notifications/state/notifications.store.ts

Modified:
- app.component.ts
- notifications.service.ts

Validation:
- Angular build passed.
- Unit tests passed.

Not verified:
- Physical Android push delivery was not tested.
```

---

## 49. Final Rule

Prefer boring, predictable, maintainable code.

Do not overengineer BizzDeal.

Do not introduce architecture for hypothetical future requirements.

Build the current feature cleanly, keep its boundaries clear, and make the next change easy.

Always ensure that all unused imports are removed from all files after finishing implementation tasks (you can run `npx organize-imports-cli "src/**/*.ts"` to do this automatically).
