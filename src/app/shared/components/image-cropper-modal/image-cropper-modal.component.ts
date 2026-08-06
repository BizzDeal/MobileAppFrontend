import { Component, Input, ElementRef, ViewChild, AfterViewInit, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ModalController, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonSpinner, IonRange, IonFooter } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  refreshOutline,
  cropOutline,
  checkmarkOutline,
  addOutline,
  removeOutline,
  swapHorizontalOutline,
  swapVerticalOutline,
  arrowUndoOutline,
  arrowRedoOutline,
  moveOutline
} from 'ionicons/icons';

export interface ImageCropResult {
  base64: string;
  blob: Blob;
  file: File;
}

@Component({
  selector: 'app-image-cropper-modal',
  standalone: true,
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonSpinner,
    IonRange,
    IonFooter
],
  templateUrl: './image-cropper-modal.component.html',
  styleUrls: ['./image-cropper-modal.component.scss']
})
export class ImageCropperModalComponent implements AfterViewInit {
  private readonly modalCtrl = inject(ModalController);

  @Input() imageSource!: File | Blob | string;
  @Input() title: string = 'Crop & Adjust Photo';
  @Input() roundCropper: boolean = true; // true for round avatar, false for square
  @Input() outputFileName: string = 'profile-photo.jpg';
  @Input() targetWidth: number = 500;
  @Input() targetHeight: number = 500;

  @ViewChild('canvasElement') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cropperContainer') cropperContainerRef!: ElementRef<HTMLDivElement>;

  // State Signals & Transformations
  readonly loading = signal<boolean>(true);
  readonly cropping = signal<boolean>(false);
  readonly zoomScale = signal<number>(1.0);
  readonly rotationDeg = signal<number>(0);
  readonly flipH = signal<boolean>(false);
  readonly flipV = signal<boolean>(false);
  readonly panX = signal<number>(0);
  readonly panY = signal<number>(0);

  private loadedImage: HTMLImageElement | null = null;
  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private initialPanX = 0;
  private initialPanY = 0;

  constructor() {
    addIcons({
      closeOutline,
      refreshOutline,
      cropOutline,
      checkmarkOutline,
      addOutline,
      removeOutline,
      swapHorizontalOutline,
      swapVerticalOutline,
      arrowUndoOutline,
      arrowRedoOutline,
      moveOutline
    });
  }

  ngAfterViewInit(): void {
    this.loadImage();
  }

  private loadImage(): void {
    if (!this.imageSource) return;

    this.loading.set(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      this.loadedImage = img;
      this.resetTransformations();
      this.loading.set(false);
      this.render();
    };

    img.onerror = () => {
      this.loading.set(false);
      console.error('Failed to load image for cropping');
    };

    if (typeof this.imageSource === 'string') {
      img.src = this.imageSource;
    } else {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        }
      };
      reader.readAsDataURL(this.imageSource);
    }
  }

  resetTransformations(): void {
    if (this.cropping() || this.loading()) return;
    this.zoomScale.set(1.0);
    this.rotationDeg.set(0);
    this.flipH.set(false);
    this.flipV.set(false);
    this.panX.set(0);
    this.panY.set(0);
    this.render();
  }

  zoomIn(): void {
    if (this.cropping() || this.loading()) return;
    this.zoomScale.update(z => Math.min(z + 0.15, 3.5));
    this.render();
  }

  zoomOut(): void {
    if (this.cropping() || this.loading()) return;
    this.zoomScale.update(z => Math.max(z - 0.15, 0.5));
    this.render();
  }

  onZoomChange(event: any): void {
    if (this.cropping() || this.loading()) return;
    const val = parseFloat(event.target?.value || event.detail?.value || '1');
    this.zoomScale.set(val);
    this.render();
  }

  rotateLeft(): void {
    if (this.cropping() || this.loading()) return;
    this.rotationDeg.update(r => (r - 90) % 360);
    this.render();
  }

  rotateRight(): void {
    if (this.cropping() || this.loading()) return;
    this.rotationDeg.update(r => (r + 90) % 360);
    this.render();
  }

  toggleFlipH(): void {
    if (this.cropping() || this.loading()) return;
    this.flipH.update(f => !f);
    this.render();
  }

  toggleFlipV(): void {
    if (this.cropping() || this.loading()) return;
    this.flipV.update(f => !f);
    this.render();
  }

  // Mouse & Touch Pan Dragging
  onMouseDown(event: MouseEvent | TouchEvent): void {
    if (this.cropping() || this.loading()) return;
    this.isDragging = true;
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    this.startX = clientX;
    this.startY = clientY;
    this.initialPanX = this.panX();
    this.initialPanY = this.panY();
  }

  onMouseMove(event: MouseEvent | TouchEvent): void {
    if (!this.isDragging || this.cropping() || this.loading()) return;
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    const deltaX = clientX - this.startX;
    const deltaY = clientY - this.startY;

    this.panX.set(this.initialPanX + deltaX);
    this.panY.set(this.initialPanY + deltaY);
    this.render();
  }

  onMouseUp(): void {
    this.isDragging = false;
  }

  // Render on Canvas
  private render(): void {
    const canvas = this.canvasRef?.nativeElement;
    const img = this.loadedImage;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.save();

    // Move to center of canvas
    ctx.translate(width / 2 + this.panX(), height / 2 + this.panY());

    // Rotate
    ctx.rotate((this.rotationDeg() * Math.PI) / 180);

    // Scale & Flip
    const scaleX = (this.flipH() ? -1 : 1) * this.zoomScale();
    const scaleY = (this.flipV() ? -1 : 1) * this.zoomScale();
    ctx.scale(scaleX, scaleY);

    // Draw Image Centered
    const imgRatio = img.width / img.height;
    let drawW = width;
    let drawH = height;

    if (imgRatio > 1) {
      drawH = width / imgRatio;
    } else {
      drawW = height * imgRatio;
    }

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }

  cancel(): void {
    if (this.cropping()) return;
    this.modalCtrl.dismiss(null, 'cancel');
  }

  applyCrop(): void {
    if (this.cropping() || this.loading()) return;

    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.loadedImage) return;

    this.cropping.set(true);

    // Defer high-res offscreen rendering so Angular updates button loading state visually
    setTimeout(() => {
      try {
        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = this.targetWidth;
        outputCanvas.height = this.targetHeight;
        const ctx = outputCanvas.getContext('2d');

        if (!ctx) {
          this.cropping.set(false);
          return;
        }

        if (this.roundCropper) {
          ctx.beginPath();
          ctx.arc(this.targetWidth / 2, this.targetHeight / 2, this.targetWidth / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
        }

        // Draw canvas state onto output canvas
        ctx.drawImage(canvas, 0, 0, this.targetWidth, this.targetHeight);

        const base64 = outputCanvas.toDataURL('image/jpeg', 0.92);

        outputCanvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], this.outputFileName, { type: 'image/jpeg' });
            const result: ImageCropResult = {
              base64,
              blob,
              file
            };
            this.modalCtrl.dismiss(result, 'confirm');
          } else {
            this.cropping.set(false);
          }
        }, 'image/jpeg', 0.92);
      } catch (error) {
        console.error('Error during image crop:', error);
        this.cropping.set(false);
      }
    }, 50);
  }
}
