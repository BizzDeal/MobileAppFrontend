import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { AdminBusinessesListComponent } from '../../components/admin-businesses-list/admin-businesses-list.component';
import { AdminRegionFilterModalComponent } from '../../components/admin-region-filter-modal/admin-region-filter-modal.component';
import { addIcons } from 'ionicons';
import { filterOutline } from 'ionicons/icons';

@Component({
  selector: 'app-admin-businesses',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    AdminBusinessesListComponent,
    AdminRegionFilterModalComponent
  ],
  templateUrl: './admin-businesses.page.html',
  styleUrls: ['./admin-businesses.page.scss']
})
export class AdminBusinessesPage {
  @ViewChild(AdminBusinessesListComponent) listComponent!: AdminBusinessesListComponent;

  segmentValue: 'ALL' | 'PENDING' | 'ACTIVE' | 'SUSPENDED' = 'ALL';
  searchQuery = '';
  stateId = '';
  districtId = '';

  isFilterOpen = false;

  constructor() {
    addIcons({ filterOutline });
  }

  openFilter() {
    this.isFilterOpen = true;
  }

  onFilterApplied(data: { stateId: string; districtId: string }) {
    const changed = this.stateId !== data.stateId || this.districtId !== data.districtId;
    this.stateId = data.stateId;
    this.districtId = data.districtId;
    if (!changed && this.listComponent) {
      this.listComponent.refresh();
    }
  }

  ionViewWillEnter() {
    if (this.listComponent) {
      this.listComponent.refresh();
    }
  }

  segmentChanged(event: any) {
    this.segmentValue = event.detail.value;
  }

  onSearch(event: any) {
    this.searchQuery = event.detail.value || '';
  }
}
