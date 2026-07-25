/**
 * Client-side image compression utility using HTML5 Canvas.
 * 
 * Downscales images exceeding `maxEdge` (default 2048px) and compresses to JPEG
 * at `quality` (default 0.8) when the input file size exceeds `maxSizeMB` (default 1.5MB).
 * 
 * Fail-safe design: Returns original File if canvas operation fails or if file
 * is non-image / vector SVG.
 */
export async function compressImageClientSide(
  file: File,
  options?: {
    maxEdge?: number;
    quality?: number;
    maxSizeMB?: number;
  }
): Promise<File> {
  const maxEdge = options?.maxEdge ?? 2048;
  const quality = options?.quality ?? 0.8;
  const maxSizeMB = options?.maxSizeMB ?? 1.5;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // Bypass non-images, vector SVGs, or files already under maxSizeMB
  if (
    !file ||
    !file.type.startsWith('image/') ||
    file.type === 'image/svg+xml' ||
    file.size <= maxSizeBytes
  ) {
    return file;
  }

  try {
    return await new Promise<File>((resolve) => {
      const reader = new FileReader();

      reader.onerror = () => resolve(file);

      reader.onload = (event) => {
        const imageSrc = event.target?.result;
        if (typeof imageSrc !== 'string') {
          return resolve(file);
        }

        const img = new Image();
        img.onerror = () => resolve(file);

        img.onload = () => {
          let { width, height } = img;

          if (width > maxEdge || height > maxEdge) {
            if (width > height) {
              height = Math.round((height * maxEdge) / width);
              width = maxEdge;
            } else {
              width = Math.round((width * maxEdge) / height);
              height = maxEdge;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve(file);
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob && blob.size < file.size) {
                const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                const compressedFile = new File([blob], `${baseName}.jpg`, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            quality
          );
        };

        img.src = imageSrc;
      };

      reader.readAsDataURL(file);
    });
  } catch {
    return file;
  }
}
