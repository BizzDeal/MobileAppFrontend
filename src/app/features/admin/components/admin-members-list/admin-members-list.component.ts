import { Component, OnInit, OnChanges, SimpleChanges, Input, HostListener } from '@angular/core';

import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AdminUsersService } from '../../services/admin-users.service';
import { AdminMember, UserStatus } from '../../models/admin-user.model';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { getAvatarColor } from '../../../../shared/utils/avatar.util';
import { ChatService } from '../../../chat/services/chat.service';
import { addIcons } from 'ionicons';
import { callOutline, chatbubblesOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-admin-members-list',
  standalone: true,
  imports: [IonicModule, CachedImgDirective],
  templateUrl: './admin-members-list.component.html',
  styleUrls: ['./admin-members-list.component.scss']
})
export class AdminMembersListComponent implements OnInit, OnChanges {
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

  members: AdminMember[] = [];
  loading = true;
  isDesktop = window.innerWidth >= 992;
  page = 1;
  limit = this.isDesktop ? 5 : 20;
  hasMore = true;
  totalPages = 1;
  private isInitialLoad = true;

  get filteredMembers(): AdminMember[] {
    return this.members; // Filtering is now handled by the API
  }

  constructor(
    private adminUsersService: AdminUsersService,
    private router: Router,
    private alertCtrl: AlertController,
    private chatService: ChatService
  ) {
    addIcons({ callOutline, chatbubblesOutline, chevronBackOutline, chevronForwardOutline });
  }

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

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['stateId'] && !changes['stateId'].firstChange) || (changes['districtId'] && !changes['districtId'].firstChange)) {
      this.refresh();
    }
  }

  refresh() {
    this.page = 1;
    this.members = [];
    this.loading = true;
    this.loadMembers();
  }

  @HostListener('window:resize')
  onResize() {
    const wasDesktop = this.isDesktop;
    this.isDesktop = window.innerWidth >= 992;
    if (this.isDesktop !== wasDesktop) {
      this.limit = this.isDesktop ? 5 : 20;
      this.refresh();
    }
  }

  loadMembers(event?: any) {
    this.loading = true;
    this.adminUsersService.getMembers(this.page, this.limit, this.searchQuery, this.stateId, this.districtId).subscribe((res) => {
      if (this.page === 1 || this.isDesktop) {
        this.members = res.data;
      } else {
        // filter out duplicates just in case
        const existingIds = new Set(this.members.map(m => m.id));
        const newMembers = res.data.filter((m: any) => !existingIds.has(m.id));
        this.members = [...this.members, ...newMembers];
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
      this.loadMembers(event);
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
      this.loadMembers();
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

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  getAvatarColor(name: string): string {
    return getAvatarColor(name);
  }

  async onCallClick(event: Event, member: AdminMember) {
    event.stopPropagation();
    
    const personalPhone = member.phone;
    const businessPhone = member.whatsapp;

    if (personalPhone && businessPhone && personalPhone !== businessPhone) {
      const alert = await this.alertCtrl.create({
        header: 'Select Number to Call',
        buttons: [
          {
            text: `Personal: ${personalPhone}`,
            handler: () => {
              window.location.href = 'tel:' + personalPhone;
            }
          },
          {
            text: `Business: ${businessPhone}`,
            handler: () => {
              window.location.href = 'tel:' + businessPhone;
            }
          },
          {
            text: 'Cancel',
            role: 'cancel'
          }
        ]
      });
      await alert.present();
    } else {
      const phoneToCall = personalPhone || businessPhone;
      if (phoneToCall) {
        window.location.href = 'tel:' + phoneToCall;
      }
    }
  }

  onChatClick(event: Event, member: AdminMember) {
    event.stopPropagation();
    this.chatService.createOrGetConversation(member.id).subscribe((conv) => {
      this.chatService.setActiveConversation(conv.id);
      this.router.navigate(['/admin/chat']);
    });
  }
}

