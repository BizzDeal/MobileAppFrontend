import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AdminUsersService } from '../../services/admin-users.service';
import { AdminMember, UserStatus } from '../../models/admin-user.model';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';

@Component({
  selector: 'app-admin-members-list',
  standalone: true,
  imports: [CommonModule, IonicModule, CachedImgDirective],
  templateUrl: './admin-members-list.component.html',
  styleUrls: ['./admin-members-list.component.scss']
})
export class AdminMembersListComponent implements OnInit {
  @Input() searchQuery = '';
  members: AdminMember[] = [];
  loading = true;

  get filteredMembers(): AdminMember[] {
    if (!this.searchQuery) return this.members;
    const q = this.searchQuery.toLowerCase().trim();
    return this.members.filter(m => 
      m.full_name.toLowerCase().includes(q) || 
      m.phone.includes(q) ||
      (m.email && m.email.toLowerCase().includes(q))
    );
  }

  constructor(
    private adminUsersService: AdminUsersService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadMembers();
  }

  loadMembers() {
    this.loading = true;
    this.adminUsersService.getMembers().subscribe((res) => {
      this.members = res.data;
      this.loading = false;
    });
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

