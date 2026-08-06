import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { MeetingWithAttendee, MeetingsService } from '../../services/meetings.service';
import { ProfileService } from '../../../profile/services/profile.service';
import { ToastService } from '../../../../core/services/toast.service';
import { addIcons } from 'ionicons';
import { closeOutline, calendarOutline, documentTextOutline, locationOutline, linkOutline, textOutline, trashOutline } from 'ionicons/icons';

@Component({
  selector: 'app-meeting-action-modal',
  templateUrl: './meeting-action-modal.component.html',
  styleUrls: ['./meeting-action-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule]
})
export class MeetingActionModalComponent implements OnInit {
  @Input() meeting?: MeetingWithAttendee;

  form!: FormGroup;
  isEdit = false;
  saving = false;

  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private profileService = inject(ProfileService);
  private meetingsService = inject(MeetingsService);
  private toastService = inject(ToastService);

  constructor() {
    addIcons({ closeOutline, calendarOutline, documentTextOutline, locationOutline, linkOutline, textOutline, trashOutline });
  }

  ngOnInit() {
    this.isEdit = !!this.meeting;

    const businessAddress = this.profileService.profile()?.business_address || '';

    this.form = this.fb.group({
      title: [this.meeting?.title || '', [Validators.required, Validators.maxLength(100)]],
      description: [this.meeting?.description || '', [Validators.maxLength(500)]],
      meeting_date: [this.formatDateForInput(this.meeting?.meeting_date) || this.formatDateForInput(new Date().toISOString()), [Validators.required]],
      location: [this.meeting?.location || businessAddress, [Validators.maxLength(255)]],
      meeting_link: [this.meeting?.meeting_link || '', [Validators.pattern('https?://.+')]]
    });
  }

  private formatDateForInput(isoDate?: string): string {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  }

  cancel() {
    if (!this.saving) {
      this.modalCtrl.dismiss();
    }
  }

  save() {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    const data = { ...this.form.value };
    data.meeting_date = new Date(data.meeting_date).toISOString();

    if (this.isEdit && this.meeting) {
      this.meetingsService.updateMeeting(this.meeting.id, data).subscribe({
        next: () => {
          this.saving = false;
          this.toastService.showSuccess('Meeting updated successfully');
          this.meetingsService.loadMeetings().subscribe();
          this.modalCtrl.dismiss(data, 'confirm');
        },
        error: (err) => {
          this.saving = false;
          const msg = err?.error?.message || 'Failed to update meeting. Please try again.';
          this.toastService.showError(msg);
        }
      });
    } else {
      this.meetingsService.createMeeting(data).subscribe({
        next: () => {
          this.saving = false;
          this.toastService.showSuccess('Meeting created successfully');
          this.meetingsService.loadMeetings().subscribe();
          this.modalCtrl.dismiss(data, 'confirm');
        },
        error: (err) => {
          this.saving = false;
          const msg = err?.error?.message || 'Failed to create meeting. Please try again.';
          this.toastService.showError(msg);
        }
      });
    }
  }

  get f() {
    return this.form.controls;
  }

  async delete() {
    if (!this.meeting || this.saving) return;
    
    const alert = await this.alertCtrl.create({
      header: 'Delete Meeting',
      message: 'Are you sure you want to delete this meeting? This action cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'confirm',
          handler: () => {
            this.saving = true;
            this.meetingsService.deleteMeeting(this.meeting!.id).subscribe({
              next: () => {
                this.saving = false;
                this.toastService.showSuccess('Meeting deleted successfully');
                this.meetingsService.loadMeetings().subscribe();
                this.modalCtrl.dismiss(null, 'delete');
              },
              error: (err) => {
                this.saving = false;
                const msg = err?.error?.message || 'Failed to delete meeting. Please try again.';
                this.toastService.showError(msg);
              }
            });
          }
        }
      ]
    });
    
    await alert.present();
  }
}
