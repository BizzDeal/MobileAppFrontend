import { Injectable, signal, computed, effect } from '@angular/core';

export interface RegionFilterState {
  states: string[];
  districts: string[];
}

@Injectable({
  providedIn: 'root',
})
export class AdminFilterStateService {
  private readonly STORAGE_KEY = 'bizzdeal_admin_region_filter';

  // Signals for state
  readonly selectedStates = signal<string[]>([]);
  readonly selectedDistricts = signal<string[]>([]);

  // Computed signal to easily get the full filter object
  readonly currentFilter = computed<RegionFilterState>(() => ({
    states: this.selectedStates(),
    districts: this.selectedDistricts(),
  }));

  // Computed signal to check if any filter is active
  readonly hasActiveFilter = computed(() => 
    this.selectedStates().length > 0 || this.selectedDistricts().length > 0
  );

  constructor() {
    this.loadFromStorage();

    // Automatically persist to localStorage whenever signals change
    effect(() => {
      const filter = this.currentFilter();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filter));
    });
  }

  updateStates(stateIds: string[]) {
    this.selectedStates.set(stateIds);
  }

  updateDistricts(districtIds: string[]) {
    this.selectedDistricts.set(districtIds);
  }

  clearFilters() {
    this.selectedStates.set([]);
    this.selectedDistricts.set([]);
  }

  private loadFromStorage() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as RegionFilterState;
        if (Array.isArray(parsed.states)) {
          this.selectedStates.set(parsed.states);
        }
        if (Array.isArray(parsed.districts)) {
          this.selectedDistricts.set(parsed.districts);
        }
      } catch (e) {
        console.error('Failed to parse admin region filter from storage', e);
      }
    }
  }
}
