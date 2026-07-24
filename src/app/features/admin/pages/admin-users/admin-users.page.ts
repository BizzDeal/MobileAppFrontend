import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AdminMembersListComponent } from '../../components/admin-members-list/admin-members-list.component';
import { AdminCustomersListComponent } from '../../components/admin-customers-list/admin-customers-list.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    AdminMembersListComponent,
    AdminCustomersListComponent
  ],
  templateUrl: './admin-users.page.html',
  styleUrls: ['./admin-users.page.scss']
})
export class AdminUsersPage {
  @ViewChild(AdminMembersListComponent) membersList?: AdminMembersListComponent;
  @ViewChild(AdminCustomersListComponent) customersList?: AdminCustomersListComponent;

  segmentValue = 'members';
  searchQuery = '';

  constructor() {}

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
