import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AdminUsersService } from '../../services/admin-users.service';
import { AdminCustomer, UserStatus } from '../../models/admin-user.model';

@Component({
  selector: 'app-admin-customers-list',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './admin-customers-list.component.html',
  styleUrls: ['./admin-customers-list.component.scss']
})
export class AdminCustomersListComponent implements OnInit {
  @Input() searchQuery = '';
  customers: AdminCustomer[] = [];
  loading = true;

  get filteredCustomers(): AdminCustomer[] {
    if (!this.searchQuery) return this.customers;
    const q = this.searchQuery.toLowerCase().trim();
    return this.customers.filter(c => 
      c.full_name.toLowerCase().includes(q) || 
      c.phone.includes(q) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  }

  constructor(
    private adminUsersService: AdminUsersService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.loading = true;
    this.adminUsersService.getCustomers().subscribe((res) => {
      this.customers = res.data;
      this.loading = false;
    });
  }

  viewUser(customer: AdminCustomer) {
    this.router.navigate(['/admin/users', customer.id]);
  }



  getStatusColor(status: UserStatus): string {
    switch (status) {
      case UserStatus.ACTIVE: return 'success';
      case UserStatus.PENDING: return 'warning';
      case UserStatus.REJECTED: return 'danger';
      case UserStatus.SUSPENDED: return 'medium';
      default: return 'primary';
    }
  }

  getFallbackAvatar(name: string): string {
    const fallbackName = name ? encodeURIComponent(name) : 'User';
    return `https://ui-avatars.com/api/?name=${fallbackName}&background=random&color=fff`;
  }
}
