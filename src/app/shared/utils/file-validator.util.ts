/**
 * Frontend file validation utility.
 * Checks file size against explicit limit in Megabytes (default 10 MB).
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFileSize(
  file: File | null | undefined,
  maxMB: number = 10
): FileValidationResult {
  if (!file) {
    return { valid: true };
  }

  const maxSizeBytes = maxMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    const actualMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${actualMB} MB) exceeds the maximum allowed limit of ${maxMB} MB. Please choose a smaller file.`,
    };
  }

  return { valid: true };
}
