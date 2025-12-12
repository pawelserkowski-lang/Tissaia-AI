import { DetectedCrop } from '../../types';

/**
 * Converts a File object to a Base64 string (raw data, no MIME prefix).
 */
export const fileToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Performs a "Smart Crop" on an image based on detected coordinates.
 * - Normalized coordinates (0-1000)
 * - Removes 10% from edges (Artifact removal)
 * - Handles rotation (0, 90, 180, 270)
 */
export const cropImage = async (sourceUrl: string, crop: DetectedCrop): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
            const canvas = document.createElement('canvas');
            const rawW = img.width;
            const rawH = img.height;

            // 1. Get Initial Bounding Box (Normalized 0-1000)
            const x1 = (crop.xmin / 1000) * rawW;
            const y1 = (crop.ymin / 1000) * rawH;
            const x2 = (crop.xmax / 1000) * rawW;
            const y2 = (crop.ymax / 1000) * rawH;

            const initialW = x2 - x1;
            const initialH = y2 - y1;

            // 2. NECRO_OS SMART CROP Logic
            // Cut 10% from each edge to remove scanner artifacts/white borders.
            const cutX = initialW * 0.10;
            const cutY = initialH * 0.10;

            const safeX = x1 + cutX;
            const safeY = y1 + cutY;
            const safeW = Math.max(initialW - (2 * cutX), 10);
            const safeH = Math.max(initialH - (2 * cutY), 10);

            const rot = crop.rotation || 0;

            // Setup canvas based on Rotation
            if (rot === 90 || rot === 270) {
                canvas.width = safeH;
                canvas.height = safeW;
            } else {
                canvas.width = safeW;
                canvas.height = safeH;
            }

            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Canvas context failed initialization');

            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((rot * Math.PI) / 180);

            if (rot === 90 || rot === 270) {
                ctx.drawImage(img, safeX, safeY, safeW, safeH, -safeW / 2, -safeH / 2, safeW, safeH);
            } else {
                ctx.drawImage(img, safeX, safeY, safeW, safeH, -safeW / 2, -safeH / 2, safeW, safeH);
            }

            const dataUrl = canvas.toDataURL('image/png');
            if (dataUrl === 'data:,') throw new Error('Canvas returned empty data');
            resolve(dataUrl);

        } catch (err: any) {
            reject(new Error(`Crop Logic Failed: ${err.message}`));
        }
      };
      img.onerror = () => reject(new Error('Failed to load source image for cropping'));
      img.src = sourceUrl;
    });
};

/**
 * Rotates an image by arbitrary degrees using Canvas.
 */
export const rotateImage = (imageUrl: string, degrees: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error("Canvas Context Failed"));
                return;
            }

            const rads = (degrees * Math.PI) / 180;
            const sin = Math.abs(Math.sin(rads));
            const cos = Math.abs(Math.cos(rads));

            const newWidth = img.width * cos + img.height * sin;
            const newHeight = img.width * sin + img.height * cos;

            canvas.width = newWidth;
            canvas.height = newHeight;

            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(rads);
            ctx.drawImage(img, -img.width / 2, -img.height / 2);

            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error("Blob creation failed"));
            }, 'image/png');
        };
        img.onerror = (e) => reject(e);
        img.src = imageUrl;
    });
};
