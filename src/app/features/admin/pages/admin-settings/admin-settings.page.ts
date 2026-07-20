import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonInput,
  IonButton,
  IonIcon,
  IonSpinner,
  IonSelect,
  IonSelectOption
} from '@ionic/angular/standalone';
import { AdminSettingsService, PlatformSettings } from '../../services/admin-settings.service';
import { AdminFilterStateService } from '../../services/admin-filter-state.service';
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
    IonSelect,
    IonSelectOption,
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

  // Region Filter
  availableStates: any[] = [];
  availableDistricts: any[] = [];
  isLoadingRegions = false;
  
  selectedStates: string[] = [];
  selectedDistricts: string[] = [];

  constructor(
    private readonly settingsService: AdminSettingsService,
    private readonly filterStateService: AdminFilterStateService
  ) {
    addIcons({ saveOutline });
    
    // Initialize component state from global signals
    this.selectedStates = [...this.filterStateService.selectedStates()];
    this.selectedDistricts = [...this.filterStateService.selectedDistricts()];
  }

  ngOnInit() {
    this.loadSettings();
    this.loadStates();
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

  loadStates() {
    this.isLoadingRegions = true;
    this.settingsService.getStates().subscribe({
      next: (states) => {
        this.availableStates = states;
        this.isLoadingRegions = false;
        if (this.selectedStates.length === 1) {
          this.loadDistricts(this.selectedStates[0]);
        }
      },
      error: (err) => {
        console.error('Failed to load states', err);
        this.isLoadingRegions = false;
      }
    });
  }

  onStateChange(event: any) {
    this.selectedStates = event.detail.value || [];
    this.selectedDistricts = []; // Reset districts when states change
    
    // Only load districts if exactly one state is selected, as fetching districts for multiple states at once isn't supported by the current endpoint easily without loop. 
    // Wait, if multiple states, maybe disable district selection or loop. Let's just clear for now if multiple.
    if (this.selectedStates.length === 1) {
      this.loadDistricts(this.selectedStates[0]);
    } else {
      this.availableDistricts = [];
    }
  }

  loadDistricts(stateId: string) {
    this.settingsService.getDistricts(stateId).subscribe({
      next: (districts) => {
        this.availableDistricts = districts;
      },
      error: (err) => {
        console.error('Failed to load districts', err);
      }
    });
  }

  saveSettings() {
    this.isSaving = true;
    
    // Save Region Filters Globally
    this.filterStateService.updateStates(this.selectedStates);
    this.filterStateService.updateDistricts(this.selectedDistricts);

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
