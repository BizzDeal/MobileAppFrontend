import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AdminUsersService } from '../../services/admin-users.service';
import { AdminMember, UserStatus } from '../../models/admin-user.model';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-admin-members-list',
  standalone: true,
  imports: [CommonModule, IonicModule, CachedImgDirective],
  templateUrl: './admin-members-list.component.html',
  styleUrls: ['./admin-members-list.component.scss']
})
export class AdminMembersListComponent implements OnInit {
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

  members: AdminMember[] = [];
  loading = true;
  page = 1;
  limit = 20;
  hasMore = true;
  private isInitialLoad = true;

  get filteredMembers(): AdminMember[] {
    return this.members; // Filtering is now handled by the API
  }

  constructor(
    private adminUsersService: AdminUsersService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadMembers();

    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.page = 1;
      this.members = [];
      this.loadMembers();
    });
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
  }

  refresh() {
    this.page = 1;
    this.members = [];
    this.loadMembers();
  }

  loadMembers(event?: any) {
    this.loading = true;
    this.adminUsersService.getMembers(this.page, this.limit, this.searchQuery).subscribe((res) => {
      if (this.page === 1) {
        this.members = res.data;
      } else {
        // filter out duplicates just in case
        const existingIds = new Set(this.members.map(m => m.id));
        const newMembers = res.data.filter((m: any) => !existingIds.has(m.id));
        this.members = [...this.members, ...newMembers];
      }
      
      if (res.meta) {
        this.page = res.meta.currentPage;
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
      this.loadMembers(event);
    } else {
      event.target.complete();
    }
  }

  viewUser(member: AdminMember) {
    this.router.navigate(['/admin/users', member.id]);
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

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
}

