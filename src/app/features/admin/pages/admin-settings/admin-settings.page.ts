import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonInput,
  IonButton,
  IonIcon,
  IonSpinner
} from '@ionic/angular/standalone';
import { AdminSettingsService, PlatformSettings } from '../../services/admin-settings.service';
import { addIcons } from 'ionicons';
import { saveOutline } from 'ionicons/icons';

@Component({
  selector: 'app-admin-settings',
  templateUrl: './admin-settings.page.html',
  styleUrls: ['./admin-settings.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonInput,
    IonButton,
    IonIcon,
    IonSpinner,
    CommonModule,
    FormsModule
  ]
})
export class AdminSettingsPage implements OnInit {
  settings: PlatformSettings = {
    mega_deals_percent_threshold: 30,
    mega_deals_fixed_threshold: 500,
    home_feed_limit: 20
  };

  isLoading = true;
  isSaving = false;

  constructor(
    private readonly settingsService: AdminSettingsService
  ) {
    addIcons({ saveOutline });
  }

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.isLoading = true;
    this.settingsService.getSettings().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.settings = res.data;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load settings', err);
        this.isLoading = false;
      }
    });
  }

  saveSettings() {
    this.isSaving = true;

    this.settingsService.updateSettings(this.settings).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.settings = res.data;
        }
        this.isSaving = false;
      },
      error: (err) => {
        console.error('Failed to save settings', err);
        this.isSaving = false;
      }
    });
  }
}
