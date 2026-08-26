import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  videocamOutline,
  filmOutline,
  playCircleOutline,
  sparklesOutline,
  pricetagOutline,
  documentTextOutline,
  globeOutline,
  createOutline,
  trashOutline,
  checkmarkCircleOutline,
  eyeOutline,
  heartOutline,
  linkOutline,
  phonePortraitOutline,
  tvOutline,
  squareOutline,
  addCircleOutline,
  closeCircleOutline,
  flashOutline,
  storefrontOutline,
  refreshOutline,
} from 'ionicons/icons';
import {
  CreateVideoRequest,
  MemberVideo,
  UpdateVideoRequest,
  VideoCategory,
  VideoType,
} from '../../models/video.model';
import { VideosService } from '../../services/videos.service';
import { ToastService } from '../../../../core/services/toast.service';
import { SafeVideoPipe } from '../../../../shared/pipes/safe-video.pipe';
import { extractFriendlyErrorMessage } from '../../../../core/utils/error.utils';
import { getAvatarColor, getInitials } from '../../../../shared/utils/avatar.util';
import { ProfileService } from '../../../profile/services/profile.service';

@Component({
  selector: 'app-video-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonIcon,
    IonSpinner,
    IonSegment,
    IonSegmentButton,
    SafeVideoPipe,
  ],
  templateUrl: './video-form.page.html',
  styleUrl: './video-form.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoFormPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly videosService = inject(VideosService);
  private readonly toastService = inject(ToastService);
  private readonly alertCtrl = inject(AlertController);
  private readonly profileService = inject(ProfileService);

  readonly isEditMode = signal<boolean>(false);
  readonly videoId = signal<string | null>(null);
  readonly submitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly activeSegment = signal<'form' | 'my-videos'>('form');

  readonly myVideos = signal<MemberVideo[]>([]);
  readonly loadingMyVideos = signal<boolean>(false);

  readonly tagsList = signal<string[]>([]);
  readonly tagInputText = signal<string>('');

  readonly popularTags = [
    'Sale',
    'MegaOffer',
    'StoreTour',
    'Trending',
    'Fashion',
    'NewArrivals',
    'FoodDeals',
    'Showcase',
  ];

  videoForm: FormGroup;

  readonly profile = this.profileService.profile;
  readonly getAvatarColor = getAvatarColor;
  readonly getInitials = getInitials;

  constructor() {
    addIcons({
      videocamOutline,
      filmOutline,
      playCircleOutline,
      sparklesOutline,
      pricetagOutline,
      documentTextOutline,
      globeOutline,
      createOutline,
      trashOutline,
      checkmarkCircleOutline,
      eyeOutline,
      heartOutline,
      linkOutline,
      phonePortraitOutline,
      tvOutline,
      squareOutline,
      addCircleOutline,
      closeCircleOutline,
      flashOutline,
      storefrontOutline,
      refreshOutline,
    });

    this.videoForm = this.fb.group({
      video_url: ['', [Validators.required, Validators.pattern(/https?:\/\/.+/)]],
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      video_type: ['SHORT_PORTRAIT' as VideoType, Validators.required],
      category: ['GENERAL' as VideoCategory, Validators.required],
      cta_title: [''],
      cta_url: [''],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.videoId.set(id);
      this.loadVideoForEdit(id);
    } else {
      this.loadMyVideos();
    }

    if (!this.profile()) {
      this.profileService.loadProfile().subscribe();
    }
  }

  get formVideoUrl(): string {
    return this.videoForm.get('video_url')?.value || '';
  }

  get formTitle(): string {
    return this.videoForm.get('title')?.value || '';
  }

  get formDescription(): string {
    return this.videoForm.get('description')?.value || '';
  }

  get formVideoType(): VideoType {
    return this.videoForm.get('video_type')?.value || 'SHORT_PORTRAIT';
  }

  get formCategory(): VideoCategory {
    return this.videoForm.get('category')?.value || 'GENERAL';
  }

  get formCtaTitle(): string {
    return this.videoForm.get('cta_title')?.value || '';
  }

  isDirectVideo(url: string): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();
    return (
      lower.endsWith('.mp4') ||
      lower.endsWith('.webm') ||
      lower.endsWith('.mov') ||
      lower.includes('.mp4?') ||
      lower.includes('.webm?')
    );
  }

  onUrlChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const url = (input.value || '').trim();

    if (url) {
      const lower = url.toLowerCase();
      // Auto-detect Shorts / Reels
      if (
        lower.includes('shorts/') ||
        lower.includes('instagram.com/reel/') ||
        lower.includes('tiktok.com')
      ) {
        this.videoForm.patchValue({ video_type: 'SHORT_PORTRAIT' });
      } else if (
        lower.includes('youtube.com/watch') ||
        lower.includes('youtu.be/') ||
        lower.includes('vimeo.com')
      ) {
        if (this.videoForm.get('video_type')?.value === 'SHORT_PORTRAIT') {
          // If was default and not shorts, set landscape
          this.videoForm.patchValue({ video_type: 'LANDSCAPE' });
        }
      }
    }
  }

  setVideoType(type: VideoType): void {
    this.videoForm.patchValue({ video_type: type });
  }

  setCategory(cat: VideoCategory): void {
    this.videoForm.patchValue({ category: cat });
  }

  onTagKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addCurrentTag();
    }
  }

  onTagInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.tagInputText.set(target.value);
  }

  addCurrentTag(): void {
    const text = this.tagInputText().trim().replace(/^#+/, '');
    if (text) {
      this.addTag(text);
      this.tagInputText.set('');
    }
  }

  addTag(tag: string): void {
    const cleaned = tag.trim().replace(/^#+/, '');
    if (cleaned && !this.tagsList().includes(cleaned)) {
      this.tagsList.update((list) => [...list, cleaned]);
    }
  }

  removeTag(tag: string): void {
    this.tagsList.update((list) => list.filter((t) => t !== tag));
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.videoForm.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  loadVideoForEdit(id: string): void {
    this.submitting.set(true);
    this.videosService.getVideoById(id).subscribe({
      next: (video) => {
        this.submitting.set(false);
        this.videoForm.patchValue({
          video_url: video.video_url,
          title: video.title,
          description: video.description || '',
          video_type: video.video_type || 'LANDSCAPE',
          category: video.category || 'GENERAL',
          cta_title: video.cta_title || '',
          cta_url: video.cta_url || '',
        });
        if (Array.isArray(video.tags)) {
          this.tagsList.set(video.tags);
        }
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = extractFriendlyErrorMessage(err, 'Failed to load video details');
        this.toastService.showError(msg);
        this.router.navigate(['/home']);
      },
    });
  }

  loadMyVideos(): void {
    this.loadingMyVideos.set(true);
    this.videosService.getMyVideos().subscribe({
      next: (videos) => {
        this.myVideos.set(videos);
        this.loadingMyVideos.set(false);
      },
      error: (err) => {
        this.loadingMyVideos.set(false);
        console.error('Error loading my videos:', err);
      },
    });
  }

  onSegmentChange(event: any): void {
    const seg = event.detail.value;
    this.activeSegment.set(seg);
    if (seg === 'my-videos') {
      this.loadMyVideos();
    }
  }

  onSubmit(): void {
    if (this.videoForm.invalid) {
      this.videoForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const fv = this.videoForm.value;
    const businessId = this.profile()?.business_id || null;

    if (this.isEditMode() && this.videoId()) {
      const updatePayload: UpdateVideoRequest = {
        title: fv.title.trim(),
        description: fv.description ? fv.description.trim() : null,
        video_url: fv.video_url.trim(),
        video_type: fv.video_type,
        category: fv.category,
        tags: this.tagsList(),
        cta_title: fv.cta_title ? fv.cta_title.trim() : null,
        cta_url: fv.cta_url ? fv.cta_url.trim() : null,
        business_id: businessId,
      };

      this.videosService.updateVideo(this.videoId()!, updatePayload).subscribe({
        next: () => {
          this.submitting.set(false);
          this.toastService.showSuccess('🎉 Video details updated successfully!');
          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.submitting.set(false);
          const msg = extractFriendlyErrorMessage(err, 'Failed to update video. Please try again.');
          this.errorMessage.set(msg);
        },
      });
    } else {
      const createPayload: CreateVideoRequest = {
        title: fv.title.trim(),
        description: fv.description ? fv.description.trim() : null,
        video_url: fv.video_url.trim(),
        video_type: fv.video_type,
        category: fv.category,
        tags: this.tagsList(),
        cta_title: fv.cta_title ? fv.cta_title.trim() : null,
        cta_url: fv.cta_url ? fv.cta_url.trim() : null,
        business_id: businessId,
      };

      this.videosService.createVideo(createPayload).subscribe({
        next: () => {
          this.submitting.set(false);
          this.toastService.showSuccess('🎉 Video published to Bizzdeal feed successfully!');
          this.resetForm();
          this.activeSegment.set('my-videos');
          this.loadMyVideos();
        },
        error: (err) => {
          this.submitting.set(false);
          const msg = extractFriendlyErrorMessage(err, 'Failed to save video. Please check your URL and try again.');
          this.errorMessage.set(msg);
        },
      });
    }
  }

  resetForm(): void {
    this.videoForm.reset({
      video_url: '',
      title: '',
      description: '',
      video_type: 'SHORT_PORTRAIT',
      category: 'GENERAL',
      cta_title: '',
      cta_url: '',
    });
    this.tagsList.set([]);
    this.tagInputText.set('');
    this.errorMessage.set(null);
  }

  onEditVideo(video: MemberVideo): void {
    this.isEditMode.set(true);
    this.videoId.set(video.id);
    this.activeSegment.set('form');
    this.videoForm.patchValue({
      video_url: video.video_url,
      title: video.title,
      description: video.description || '',
      video_type: video.video_type || 'LANDSCAPE',
      category: video.category || 'GENERAL',
      cta_title: video.cta_title || '',
      cta_url: video.cta_url || '',
    });
    this.tagsList.set(video.tags || []);
  }

  async onDeleteVideo(video: MemberVideo): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Delete Video',
      message: `Are you sure you want to remove "${video.title}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.videosService.deleteVideo(video.id).subscribe({
              next: () => {
                this.toastService.showSuccess('Video deleted');
                this.loadMyVideos();
              },
              error: (err) => {
                const msg = extractFriendlyErrorMessage(err, 'Failed to delete video');
                this.toastService.showError(msg);
              },
            });
          },
        },
      ],
    });
    await alert.present();
  }

  async toggleVideoStatus(video: MemberVideo): Promise<void> {
    const nextStatus = video.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.videosService.updateVideo(video.id, { status: nextStatus }).subscribe({
      next: () => {
        this.toastService.showSuccess(
          `Video marked as ${nextStatus === 'ACTIVE' ? 'Active' : 'Hidden'}`
        );
        this.loadMyVideos();
      },
      error: (err) => {
        const msg = extractFriendlyErrorMessage(err, 'Failed to update video status');
        this.toastService.showError(msg);
      },
    });
  }
}
