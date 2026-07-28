/**
 * Helper function to determine if a message string contains technical details or URLs that shouldn't be shown to end users.
 */
function isTechnicalError(msg: string): boolean {
  if (!msg || typeof msg !== 'string') return true;
  const lower = msg.toLowerCase();
  return (
    lower.includes('http failure response') ||
    lower.includes('http failure during') ||
    lower.includes('0 unknown error') ||
    lower.includes('unknown error') ||
    lower.includes('http://') ||
    lower.includes('https://') ||
    lower.startsWith('cannot get') ||
    lower.startsWith('cannot post') ||
    lower.startsWith('cannot put') ||
    lower.startsWith('cannot delete') ||
    lower.startsWith('cannot patch') ||
    lower.includes('typeerror:') ||
    lower.includes('uncaught ')
  );
}

/**
 * Extracts a user-friendly error message from an API error response.
 * Prevents raw technical HTTP errors (e.g. "Http failure response...") from leaking to the UI.
 * 
 * @param error The caught error object
 * @param fallback The fallback message if extraction fails
 * @returns A friendly error message string
 */
export function extractFriendlyErrorMessage(error: any, fallback: string = 'An unexpected error occurred. Please try again.'): string {
  if (!error) {
    return fallback;
  }

  // If error passed is directly a string
  if (typeof error === 'string') {
    return isTechnicalError(error) ? fallback : error;
  }

  // Handle nested error object from backend (NestJS error format)
  const apiMessage = error?.error?.message;
  if (apiMessage) {
    if (Array.isArray(apiMessage)) {
      // NestJS validation pipe array of errors
      const joined = apiMessage.filter((m: any) => typeof m === 'string').join(', ');
      if (joined && !isTechnicalError(joined)) {
        return joined;
      }
    } else if (typeof apiMessage === 'string') {
      if (!isTechnicalError(apiMessage)) {
        return apiMessage;
      }
    }
  }

  // If error.error is directly a string message
  if (error?.error && typeof error.error === 'string' && !isTechnicalError(error.error)) {
    return error.error;
  }

  // Handle generic network connection errors (status 0: server offline, CORS, network down)
  if (error?.status === 0) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  // Handle 5xx server errors without explicit friendly backend message
  if (typeof error?.status === 'number' && error.status >= 500) {
    return fallback;
  }

  // Use error.message only if present and not technical
  if (error?.message && typeof error.message === 'string' && !isTechnicalError(error.message)) {
    return error.message;
  }

  // Return the friendly fallback
  return fallback;
}

