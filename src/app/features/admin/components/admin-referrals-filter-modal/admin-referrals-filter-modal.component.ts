import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AdminSettingsService } from '../../services/admin-settings.service';
import { addIcons } from 'ionicons';
import { closeOutline, checkmarkOutline, filterOutline, refreshOutline, locationOutline, caretDownSharp } from 'ionicons/icons';
import { AdminReferralsFilter } from '../../services/admin-referrals-state.service';

type DateFilterMode = 'particular' | 'dateRange' | 'monthRange' | 'none';

@Component({
  selector: 'app-admin-referrals-filter-modal',
  templateUrl: './admin-referrals-filter-modal.component.html',
  styleUrls: ['./admin-referrals-filter-modal.component.scss'],
  standalone: true,
  imports: [FormsModule, IonicModule]
})
export class AdminReferralsFilterModalComponent implements OnInit, OnChanges {
  @Input() isOpen: boolean = false;
  @Input() initialFilter: AdminReferralsFilter = { startDate: null, endDate: null, stateId: null, districtId: null };

  @Output() filterApplied = new EventEmitter<AdminReferralsFilter>();
  @Output() closed = new EventEmitter<void>();

  // Date Filter State
  dateFilterMode: DateFilterMode = 'none';
  particularDate: string | string[] = '';
  startDate: string = '';
  endDate: string = '';
  selectedMonth: string = '';

  // Region Filter State
  availableStates: any[] = [];
  availableDistricts: any[] = [];
  isLoadingStates = false;
  isLoadingDistricts = false;
  selectedState: string = '';
  selectedDistrict: string = '';

  constructor(private settingsService: AdminSettingsService) {
    addIcons({ closeOutline, checkmarkOutline, filterOutline, refreshOutline, locationOutline, caretDownSharp });
  }

  ngOnInit() {
    this.loadStates();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && changes['isOpen'].currentValue === true) {
      this.syncStateWithInitialFilter();
    }
  }

  syncStateWithInitialFilter() {
    this.selectedState = this.initialFilter.stateId || '';
    this.selectedDistrict = this.initialFilter.districtId || '';

    if (this.selectedState && this.availableStates.length > 0) {
      this.loadDistricts(this.selectedState);
    }

    if (this.initialFilter.dates) {
      this.dateFilterMode = 'particular';
      this.particularDate = this.initialFilter.dates.split(',');
    } else if (this.initialFilter.startDate && this.initialFilter.endDate) {
      if (this.initialFilter.startDate === this.initialFilter.endDate) {
        this.dateFilterMode = 'particular';
        this.particularDate = this.initialFilter.startDate;
      } else {
        // Simple heuristic for month range vs date range
        this.dateFilterMode = 'dateRange';
        this.startDate = this.initialFilter.startDate;
        this.endDate = this.initialFilter.endDate;
      }
    } else {
      this.dateFilterMode = 'none';
      this.particularDate = '';
      this.startDate = '';
      this.endDate = '';
      this.selectedMonth = '';
    }
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
    this.dateFilterMode = 'none';
    this.particularDate = '';
    this.startDate = '';
    this.endDate = '';
    this.selectedMonth = '';
    
    this.selectedState = '';
    this.selectedDistrict = '';
    this.availableDistricts = [];
  }

  apply() {
    let finalStartDate: string | null = null;
    let finalEndDate: string | null = null;
    let finalDates: string | null = null;

    if (this.dateFilterMode === 'particular' && this.particularDate) {
      if (Array.isArray(this.particularDate)) {
        finalDates = this.particularDate.map(d => d.split('T')[0]).join(',');
      } else {
        finalDates = this.particularDate.split('T')[0];
      }
    } else if (this.dateFilterMode === 'dateRange' && this.startDate && this.endDate) {
      finalStartDate = this.startDate.split('T')[0];
      finalEndDate = this.endDate.split('T')[0];
    } else if (this.dateFilterMode === 'monthRange' && this.selectedMonth) {
      const d = new Date(this.selectedMonth);
      const year = d.getFullYear();
      const month = d.getMonth();
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);
      
      const pad = (n: number) => n < 10 ? '0' + n : n;
      finalStartDate = `${year}-${pad(month + 1)}-01`;
      finalEndDate = `${year}-${pad(month + 1)}-${pad(endOfMonth.getDate())}`;
    }

    this.filterApplied.emit({
      startDate: finalStartDate,
      endDate: finalEndDate,
      dates: finalDates,
      stateId: this.selectedState || null,
      districtId: this.selectedDistrict || null
    });
    this.closed.emit();
  }

  cancel() {
    this.closed.emit();
  }
}
