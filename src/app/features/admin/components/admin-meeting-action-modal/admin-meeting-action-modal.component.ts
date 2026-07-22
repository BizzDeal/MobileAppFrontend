import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { MeetingWithAttendee } from '../../../meetings/services/meetings.service';
import { addIcons } from 'ionicons';
import { closeOutline, calendarOutline, documentTextOutline, locationOutline, linkOutline, textOutline, trashOutline } from 'ionicons/icons';

@Component({
  selector: 'app-admin-meeting-action-modal',
  templateUrl: './admin-meeting-action-modal.component.html',
  styleUrls: ['./admin-meeting-action-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule]
})
export class AdminMeetingActionModalComponent implements OnInit {
  @Input() meeting?: MeetingWithAttendee;

  form!: FormGroup;
  isEdit = false;

  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);

  private alertCtrl = inject(AlertController);

  constructor() {
    addIcons({ closeOutline, calendarOutline, documentTextOutline, locationOutline, linkOutline, textOutline, trashOutline });
  }

  ngOnInit() {
    this.isEdit = !!this.meeting;
    this.form = this.fb.group({
      title: [this.meeting?.title || '', [Validators.required, Validators.maxLength(100)]],
      description: [this.meeting?.description || '', [Validators.maxLength(500)]],
      meeting_date: [this.formatDateForInput(this.meeting?.meeting_date) || this.formatDateForInput(new Date().toISOString()), [Validators.required]],
      location: [this.meeting?.location || '', [Validators.maxLength(255)]],
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
    this.modalCtrl.dismiss();
  }

  save() {
    if (this.form.valid) {
      const data = { ...this.form.value };
      data.meeting_date = new Date(data.meeting_date).toISOString();
      this.modalCtrl.dismiss(data, 'confirm');
    } else {
      this.form.markAllAsTouched();
    }
  }

  get f() {
    return this.form.controls;
  }

  async delete() {
    if (!this.meeting) return;
    
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
            this.modalCtrl.dismiss(null, 'delete');
          }
        }
      ]
    });
    
    await alert.present();
  }

}
