import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthSessionService } from '../../../../core/services/auth-session.service';

@Component({
  selector: 'app-pending-approval',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          
          @if (isRejected()) {
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            <h2 class="mt-2 text-2xl font-bold tracking-tight text-gray-900">
              Application Rejected
            </h2>
            
            <p class="mt-4 text-sm text-gray-600">
              We regret to inform you that your BizzDeal member application was not approved.
            </p>

            @if (rejectionReason()) {
              <div class="mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded text-left">
                <span class="block text-xs font-semibold text-red-800 uppercase tracking-wider">Reason for Rejection:</span>
                <p class="mt-1 text-sm text-red-700 font-medium">{{ rejectionReason() }}</p>
              </div>
            }

            <p class="mt-4 text-xs text-gray-500">
              Please review the feedback above or contact support for further assistance.
            </p>
          } @else {
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h2 class="mt-2 text-2xl font-bold tracking-tight text-gray-900">
              Payment Successful!
            </h2>
            
            <p class="mt-4 text-sm text-gray-600">
              Your account is currently pending with admin approval. You will be notified once an admin reviews and activates your account.
            </p>
          }

          <div class="mt-8">
            <button 
              type="button" 
              (click)="logout()"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Logout
            </button>
          </div>
          
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class PendingApprovalPage {
  private readonly authSession = inject(AuthSessionService);

  readonly currentUser = this.authSession.currentUser;
  readonly isRejected = computed(() => this.currentUser()?.status === 'REJECTED');
  readonly rejectionReason = computed(() => (this.currentUser() as any)?.rejection_reason || null);

  logout() {
    this.authSession.logout(true);
  }
}
