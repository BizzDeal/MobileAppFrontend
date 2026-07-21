/**
 * Extracts a user-friendly error message from an API error response.
 * Prevents raw technical HTTP errors (e.g. "Http failure response...") from leaking to the UI.
 * 
 * @param error The caught error object
 * @param fallback The fallback message if extraction fails
 * @returns A friendly error message string
 */
export function extractFriendlyErrorMessage(error: any, fallback: string = 'An unexpected error occurred. Please try again.'): string {
  // If backend provided a specific message, use it
  if (error?.error?.message && typeof error.error.message === 'string') {
    // Exclude generic Node/Nest routing errors if they leak URLs
    if (!error.error.message.startsWith('Cannot ') && !error.error.message.includes('http')) {
      return error.error.message;
    }
  }

  // Handle generic network connection errors (status 0)
  if (error?.status === 0) {
    return 'Network error. Please check your internet connection.';
  }

  // Use the error message only if it's not a generic raw Angular HTTP failure message
  if (error?.message && typeof error.message === 'string' && !error.message.includes('Http failure response')) {
    return error.message;
  }

  // Return the friendly fallback
  return fallback;
}
