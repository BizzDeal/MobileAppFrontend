import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  gridOutline, 
  peopleOutline, 
  businessOutline, 
  pricetagsOutline, 
  barChartOutline, 
  settingsOutline,
  notificationsOutline,
  searchOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, IonicModule]
})
export class AdminLayoutComponent {
  public appPages = [
    { title: 'Dashboard', url: '/admin/dashboard', icon: 'grid' },
    { title: 'Users', url: '/admin/users', icon: 'people' },
    { title: 'Businesses', url: '/admin/businesses', icon: 'business' },
    { title: 'Offers/Deals', url: '/admin/offers', icon: 'pricetags' },
    { title: 'Analytics', url: '/admin/analytics', icon: 'bar-chart' },
    { title: 'Settings', url: '/admin/settings', icon: 'settings' },
  ];

  constructor() {
    addIcons({
      gridOutline, 
      peopleOutline, 
      businessOutline, 
      pricetagsOutline, 
      barChartOutline, 
      settingsOutline,
      notificationsOutline,
      searchOutline
    });
  }
}
