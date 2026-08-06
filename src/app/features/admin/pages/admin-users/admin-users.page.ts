import { Component, ViewChild } from '@angular/core';

import { IonicModule, ModalController } from '@ionic/angular';
import { AdminMembersListComponent } from '../../components/admin-members-list/admin-members-list.component';
import { AdminCustomersListComponent } from '../../components/admin-customers-list/admin-customers-list.component';
import { AdminRegionFilterModalComponent } from '../../components/admin-region-filter-modal/admin-region-filter-modal.component';
import { addIcons } from 'ionicons';
import { filterOutline } from 'ionicons/icons';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    IonicModule,
    AdminMembersListComponent,
    AdminCustomersListComponent,
    AdminRegionFilterModalComponent
],
  templateUrl: './admin-users.page.html',
  styleUrls: ['./admin-users.page.scss']
})
export class AdminUsersPage {
  @ViewChild(AdminMembersListComponent) membersList?: AdminMembersListComponent;
  @ViewChild(AdminCustomersListComponent) customersList?: AdminCustomersListComponent;

  segmentValue = 'members';
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
    if (!changed) {
      if (this.segmentValue === 'members' && this.membersList) {
        this.membersList.refresh();
      } else if (this.segmentValue === 'customers' && this.customersList) {
        this.customersList.refresh();
      }
    }
  }

  ionViewWillEnter() {
    if (this.membersList) {
      this.membersList.refresh();
    }
    if (this.customersList) {
      this.customersList.refresh();
    }
  }

  segmentChanged(event: any) {
    this.segmentValue = event.detail.value;
  }

  onSearch(event: any) {
    this.searchQuery = event.detail.value || '';
  }
}
