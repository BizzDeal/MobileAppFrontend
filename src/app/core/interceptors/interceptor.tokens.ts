import { HttpContextToken } from '@angular/common/http';

// Token to tell the api-message interceptor to show a success toast for a mutation
export const SHOW_SUCCESS_TOAST = new HttpContextToken<boolean>(() => false);
