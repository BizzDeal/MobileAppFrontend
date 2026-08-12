import { Component, OnInit, OnChanges, SimpleChanges, Input, HostListener } from '@angular/core';

import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AdminUsersService } from '../../services/admin-users.service';
import { AdminCustomer, UserStatus } from '../../models/admin-user.model';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { getAvatarColor } from '../../../../shared/utils/avatar.util';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import { chevronForward, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-admin-customers-list',
  standalone: true,
  imports: [IonicModule, CachedImgDirective],
  templateUrl: './admin-customers-list.component.html',
  styleUrls: ['./admin-customers-list.component.scss']
})
export class AdminCustomersListComponent implements OnInit, OnChanges {
  @Input() set searchQuery(val: string) {
    this._searchQuery = val;
    this.searchSubject.next(val);
  }
  get searchQuery(): string {
    return this._searchQuery;
  }
  private _searchQuery = '';
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  @Input() stateId: string = '';
  @Input() districtId: string = '';

  customers: AdminCustomer[] = [];
  loading = true;
  isDesktop = window.innerWidth >= 992;
  page = 1;
  limit = this.isDesktop ? 5 : 20;
  hasMore = true;
  totalPages = 1;
  private isInitialLoad = true;

  get filteredCustomers(): AdminCustomer[] {
    return this.customers; // Filtering is now handled by the API
  }

  constructor(
    private adminUsersService: AdminUsersService,
    private router: Router
  ) {
    addIcons({ chevronForward, chevronBackOutline, chevronForwardOutline });
  }

  ngOnInit() {
    this.loadCustomers();

    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.page = 1;
      this.customers = [];
      this.loadCustomers();
    });
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['stateId'] && !changes['stateId'].firstChange) || (changes['districtId'] && !changes['districtId'].firstChange)) {
      this.refresh();
    }
  }

  refresh() {
    this.page = 1;
    this.customers = [];
    this.loading = true;
    this.loadCustomers();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    const wasDesktop = this.isDesktop;
    this.isDesktop = window.innerWidth >= 992;
    if (this.isDesktop !== wasDesktop) {
      this.limit = this.isDesktop ? 5 : 20;
      this.refresh();
    }
  }

  loadCustomers(event?: any) {
    this.loading = true;
    this.adminUsersService.getCustomers(this.page, this.limit, this.searchQuery, this.stateId, this.districtId).subscribe((res) => {
      if (this.page === 1 || this.isDesktop) {
        this.customers = res.data;
      } else {
        // filter out duplicates just in case
        const existingIds = new Set(this.customers.map(c => c.id));
        const newCustomers = res.data.filter((c: any) => !existingIds.has(c.id));
        this.customers = [...this.customers, ...newCustomers];
      }

      if (res.meta) {
        this.page = res.meta.currentPage;
        this.totalPages = res.meta.totalPages;
        this.hasMore = res.meta.currentPage < res.meta.totalPages;
      } else {
        this.hasMore = res.data.length === this.limit;
      }
      this.loading = false;
      if (event) event.target.complete();
    }, () => {
      this.loading = false;
      if (event) event.target.complete();
    });
  }

  loadMore(event: any) {
    if (this.hasMore) {
      this.page++;
      this.loadCustomers(event);
    } else {
      event.target.complete();
    }
  }

  changePageSize(event: any) {
    this.limit = parseInt(event.target.value, 10);
    this.refresh();
  }

  changePage(newPage: number) {
    if (newPage > 0 && newPage <= this.totalPages) {
      this.page = newPage;
      this.loadCustomers();
    }
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

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  getAvatarColor(name: string): string {
    return getAvatarColor(name);
  }
}
