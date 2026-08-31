import {
  Component,
  Input,
  OnInit,
  ViewChild,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ModalController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonSpinner,
  IonFooter
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  arrowBackOutline,
  refreshOutline,
  cropOutline,
  checkmarkOutline,
  addOutline,
  removeOutline,
  swapHorizontalOutline,
  swapVerticalOutline,
  expandOutline,
  squareOutline,
  scanOutline
} from 'ionicons/icons';
import {
  ImageCropperComponent,
  ImageCroppedEvent,
  LoadedImage,
  base64ToFile
} from 'ngx-image-cropper';

export interface ImageCropResult {
  base64: string;
  blob: Blob;
  file: File;
}

export type AspectRatioMode = 'free' | 'original' | '1:1' | '16:9' | '4:3';

@Component({
  selector: 'app-image-cropper-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonSpinner,
    IonFooter,
    ImageCropperComponent
  ],
  templateUrl: './image-cropper-modal.component.html',
  styleUrls: ['./image-cropper-modal.component.scss']
})
export class ImageCropperModalComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);

  @ViewChild(ImageCropperComponent) cropperComponent?: ImageCropperComponent;

  @Input() imageSource!: File | Blob | string;
  @Input() title: string = 'Crop & Rotate';
  @Input() roundCropper: boolean = false;
  @Input() aspectRatio: number = 0; // 0 for freeform by default
  @Input() outputFileName: string = 'cropped-photo.jpg';
  @Input() targetWidth: number = 800;
  @Input() targetHeight: number = 800;

  // Source signals
  readonly imageFile = signal<File | undefined>(undefined);
  readonly imageBase64 = signal<string | undefined>(undefined);
  readonly imageURL = signal<string | undefined>(undefined);

  // States
  readonly loading = signal<boolean>(true);
  readonly cropping = signal<boolean>(false);
  readonly activeRatioMode = signal<AspectRatioMode>('free');
  readonly maintainAspectRatio = signal<boolean>(false);
  readonly currentAspectRatio = signal<number>(1);
  readonly originalRatio = signal<number>(1);
  readonly canvasRotation = signal<number>(0);
  readonly zoomScale = signal<number>(1);
  readonly flipH = signal<boolean>(false);
  readonly flipV = signal<boolean>(false);

  private latestCroppedEvent: ImageCroppedEvent | null = null;

  readonly isRoundCropperActive = computed(() => {
    return this.roundCropper && this.activeRatioMode() === '1:1';
  });

  readonly transform = computed(() => ({
    scale: this.zoomScale(),
    rotate: 0,
    flipH: this.flipH(),
    flipV: this.flipV()
  }));

  constructor() {
    addIcons({
      closeOutline,
      arrowBackOutline,
      refreshOutline,
      cropOutline,
      checkmarkOutline,
      addOutline,
      removeOutline,
      swapHorizontalOutline,
      swapVerticalOutline,
      expandOutline,
      squareOutline,
      scanOutline
    });
  }

  ngOnInit(): void {
    this.initImageSource();
    this.initAspectRatio();
  }

  private initImageSource(): void {
    if (!this.imageSource) {
      this.loading.set(false);
      return;
    }

    if (this.imageSource instanceof File) {
      this.imageFile.set(this.imageSource);
    } else if (this.imageSource instanceof Blob) {
      const file = new File([this.imageSource], this.outputFileName, {
        type: this.imageSource.type || 'image/jpeg'
      });
      this.imageFile.set(file);
    } else if (typeof this.imageSource === 'string') {
      if (this.imageSource.startsWith('data:')) {
        this.imageBase64.set(this.imageSource);
      } else {
        this.imageURL.set(this.imageSource);
      }
    }
  }

  private initAspectRatio(): void {
    if (this.roundCropper) {
      // Profile avatars start in 1:1 square/circular mode, with full ability to switch to free-form
      this.setAspectRatioMode('1:1');
    } else if (this.aspectRatio && this.aspectRatio > 0) {
      if (Math.abs(this.aspectRatio - 1) < 0.02) {
        this.setAspectRatioMode('1:1');
      } else if (Math.abs(this.aspectRatio - 16 / 9) < 0.05) {
        this.setAspectRatioMode('16:9');
      } else if (Math.abs(this.aspectRatio - 4 / 3) < 0.05) {
        this.setAspectRatioMode('4:3');
      } else {
        this.currentAspectRatio.set(this.aspectRatio);
        this.maintainAspectRatio.set(true);
        this.activeRatioMode.set('free');
      }
    } else {
      // Free-form WhatsApp crop by default
      this.setAspectRatioMode('free');
    }
  }

  setAspectRatioMode(mode: AspectRatioMode): void {
    this.activeRatioMode.set(mode);
    switch (mode) {
      case 'free':
        this.maintainAspectRatio.set(false);
        break;
      case 'original':
        this.currentAspectRatio.set(this.originalRatio());
        this.maintainAspectRatio.set(true);
        break;
      case '1:1':
        this.currentAspectRatio.set(1);
        this.maintainAspectRatio.set(true);
        break;
      case '16:9':
        this.currentAspectRatio.set(16 / 9);
        this.maintainAspectRatio.set(true);
        break;
      case '4:3':
        this.currentAspectRatio.set(4 / 3);
        this.maintainAspectRatio.set(true);
        break;
    }
  }

  onImageLoaded(image: LoadedImage): void {
    this.loading.set(false);
    if (image?.original?.size?.width && image?.original?.size?.height) {
      const ratio = image.original.size.width / image.original.size.height;
      this.originalRatio.set(ratio);
      if (this.activeRatioMode() === 'original') {
        this.currentAspectRatio.set(ratio);
      }
    }
  }

  onCropperReady(): void {
    this.loading.set(false);
  }

  onLoadImageFailed(): void {
    this.loading.set(false);
    console.error('Failed to load image into WhatsApp cropper');
  }

  onImageCropped(event: ImageCroppedEvent): void {
    this.latestCroppedEvent = event;
  }

  // 90° Clockwise Rotation
  rotate90(): void {
    if (this.loading() || this.cropping()) return;
    this.canvasRotation.update(r => (r + 1) % 4);
  }

  toggleFlipH(): void {
    if (this.loading() || this.cropping()) return;
    this.flipH.update(f => !f);
  }

  toggleFlipV(): void {
    if (this.loading() || this.cropping()) return;
    this.flipV.update(f => !f);
  }

  zoomIn(): void {
    if (this.loading() || this.cropping()) return;
    this.zoomScale.update(s => Math.min(Number((s + 0.15).toFixed(2)), 3.0));
  }

  zoomOut(): void {
    if (this.loading() || this.cropping()) return;
    this.zoomScale.update(s => Math.max(Number((s - 0.15).toFixed(2)), 0.5));
  }

  reset(): void {
    if (this.loading() || this.cropping()) return;
    this.canvasRotation.set(0);
    this.zoomScale.set(1);
    this.flipH.set(false);
    this.flipV.set(false);
    if (this.roundCropper) {
      this.setAspectRatioMode('1:1');
    } else {
      this.setAspectRatioMode('free');
    }
  }

  cancel(): void {
    if (this.cropping()) return;
    this.modalCtrl.dismiss(null, 'cancel');
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || '');
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async applyCrop(): Promise<void> {
    if (this.cropping() || this.loading()) return;
    this.cropping.set(true);

    try {
      let base64 = this.latestCroppedEvent?.base64 || '';
      let blob = this.latestCroppedEvent?.blob;

      // Fallback: manually trigger crop if base64 not yet present
      if (!base64 && this.cropperComponent) {
        const manualCrop = this.cropperComponent.crop('base64');
        if (manualCrop?.base64) {
          base64 = manualCrop.base64;
        }
      }

      // If we have blob but no base64, convert it
      if (!base64 && blob) {
        base64 = await this.blobToBase64(blob);
      }

      // If we have base64 but no blob, convert it
      if (base64 && !blob) {
        blob = base64ToFile(base64);
      }

      if (base64 && blob) {
        const file = new File([blob], this.outputFileName, { type: 'image/jpeg' });
        const result: ImageCropResult = {
          base64,
          blob,
          file
        };
        await this.modalCtrl.dismiss(result, 'confirm');
      } else {
        console.error('Could not extract cropped image: missing base64 or blob');
        this.cropping.set(false);
      }
    } catch (err) {
      console.error('Error while applying crop:', err);
      this.cropping.set(false);
    }
  }
}
