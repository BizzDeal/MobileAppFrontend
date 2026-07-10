import { Component } from '@angular/core';
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
  segmentValue = 'members';
  searchQuery = '';

  constructor() {}

  segmentChanged(event: any) {
    this.segmentValue = event.detail.value;
  }

  onSearch(event: any) {
    this.searchQuery = event.detail.value || '';
  }
}
