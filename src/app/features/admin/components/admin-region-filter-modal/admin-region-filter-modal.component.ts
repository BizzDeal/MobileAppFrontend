import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AdminSettingsService } from '../../services/admin-settings.service';
import { addIcons } from 'ionicons';
import { closeOutline, checkmarkOutline, filterOutline, refreshOutline } from 'ionicons/icons';

@Component({
  selector: 'app-admin-region-filter-modal',
  templateUrl: './admin-region-filter-modal.component.html',
  styleUrls: ['./admin-region-filter-modal.component.scss'],
  standalone: true,
  imports: [FormsModule, IonicModule]
})
export class AdminRegionFilterModalComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Input() stateId: string = '';
  @Input() districtId: string = '';

  @Output() filterApplied = new EventEmitter<{ stateId: string; districtId: string }>();
  @Output() closed = new EventEmitter<void>();

  availableStates: any[] = [];
  availableDistricts: any[] = [];
  isLoadingStates = false;
  isLoadingDistricts = false;

  selectedState: string = '';
  selectedDistrict: string = '';

  constructor(
    private settingsService: AdminSettingsService
  ) {
    addIcons({ closeOutline, checkmarkOutline, filterOutline, refreshOutline });
  }

  ngOnInit() {
    this.selectedState = this.stateId || '';
    this.selectedDistrict = this.districtId || '';
    this.loadStates();
  }

  loadStates() {
    this.isLoadingStates = true;
    this.settingsService.getStates().subscribe({
      next: (states) => {
        this.availableStates = states;
        this.isLoadingStates = false;
        
        if (this.selectedState) {
          this.loadDistricts(this.selectedState);
        }
      },
      error: (err) => {
        console.error('Failed to load states', err);
        this.isLoadingStates = false;
      }
    });
  }

  onStateChange() {
    this.selectedDistrict = '';
    this.availableDistricts = [];
    if (this.selectedState) {
      this.loadDistricts(this.selectedState);
    }
  }

  loadDistricts(stateId: string) {
    this.isLoadingDistricts = true;
    this.settingsService.getDistricts(stateId).subscribe({
      next: (districts) => {
        this.availableDistricts = districts;
        this.isLoadingDistricts = false;
      },
      error: (err) => {
        console.error('Failed to load districts', err);
        this.isLoadingDistricts = false;
      }
    });
  }

  clearFilter() {
    this.selectedState = '';
    this.selectedDistrict = '';
    this.availableDistricts = [];
  }

  apply() {
    this.filterApplied.emit({
      stateId: this.selectedState,
      districtId: this.selectedDistrict
    });
    this.closed.emit();
  }

  cancel() {
    this.closed.emit();
  }
}
