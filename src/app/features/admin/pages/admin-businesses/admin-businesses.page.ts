import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AdminBusinessesListComponent } from '../../components/admin-businesses-list/admin-businesses-list.component';

@Component({
  selector: 'app-admin-businesses',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    AdminBusinessesListComponent
  ],
  templateUrl: './admin-businesses.page.html',
  styleUrls: ['./admin-businesses.page.scss']
})
export class AdminBusinessesPage {
  segmentValue: 'ALL' | 'PENDING' | 'ACTIVE' | 'SUSPENDED' = 'ALL';
  searchQuery = '';

  constructor() {}

  segmentChanged(event: any) {
    this.segmentValue = event.detail.value;
  }

  onSearch(event: any) {
    this.searchQuery = event.detail.value || '';
  }
}
