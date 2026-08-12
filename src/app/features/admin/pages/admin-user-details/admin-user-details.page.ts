import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { AdminUsersService } from '../../services/admin-users.service';
import { AdminMember, AdminCustomer, UserStatus, UserRole, AdminUser } from '../../models/admin-user.model';
import { addIcons } from 'ionicons';
import { 
  callOutline, logoWhatsapp, mailOutline, locationOutline, 
  personOutline, calendarOutline, checkmarkCircleOutline, 
  warningOutline, closeCircleOutline, trashOutline,
  businessOutline, documentTextOutline, globeOutline, imageOutline,
  mapOutline, navigateOutline
} from 'ionicons/icons';
import mediumZoom, { Zoom } from 'medium-zoom';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { ProfileSkeletonComponent } from '../../../../shared/components/skeletons/profile-skeleton/profile-skeleton.component';
import { AdminLogoutButtonComponent } from '../../components/admin-logout-button/admin-logout-button.component';

@Component({
  selector: 'app-admin-user-details',
  standalone: true,
  imports: [CommonModule, IonicModule, CachedImgDirective, ProfileSkeletonComponent, AdminLogoutButtonComponent],
  providers: [AdminUsersService],
  templateUrl: './admin-user-details.page.html',
  styleUrls: ['./admin-user-details.page.scss']
})
export class AdminUserDetailsPage implements OnInit, AfterViewChecked {
  activeTab: 'personal' | 'business' = 'personal';

  goBack() {
    this.location.back();
  }

  setTab(tab: 'personal' | 'business') {
    this.activeTab = tab;
  }
  @ViewChild('receiptImage') receiptImageRef?: ElementRef<HTMLImageElement>;
  user: AdminUser | null = null;
  loading = true;
  private zoom?: Zoom;
  private zoomAttached = false;

  constructor(
    private route: ActivatedRoute,
    private adminUsersService: AdminUsersService,
    private location: Location
  ) {
    addIcons({
      callOutline, logoWhatsapp, mailOutline, locationOutline, 
      personOutline, calendarOutline, checkmarkCircleOutline, 
      warningOutline, closeCircleOutline, trashOutline,
      businessOutline, documentTextOutline, globeOutline, imageOutline,
      mapOutline, navigateOutline
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadUser(id);
    } else {
      this.loading = false;
    }
  }

  ngAfterViewChecked() {
    if (this.receiptImageRef?.nativeElement && !this.zoomAttached) {
      this.zoom = mediumZoom(this.receiptImageRef.nativeElement, {
        margin: 24,
        background: 'rgba(0,0,0,0.9)'
      });
      this.zoomAttached = true;
    }
  }

  loadUser(id: string) {
    this.loading = true;
    this.adminUsersService.getUserById(id).subscribe(res => {
      this.user = res.data;
      this.loading = false;
      this.zoomAttached = false;
    });
  }

  isMember(user: any): user is AdminMember {
    return user?.role === UserRole.MEMBER;
  }

  async confirmAction(action: 'approve' | 'reject' | 'suspend' | 'delete') {
    if (!this.user) return;
    
    const actionText = action.charAt(0).toUpperCase() + action.slice(1);
    const confirmed = window.confirm(`Are you sure you want to ${action} ${this.user.full_name}?`);
    
    if (confirmed) {
      this.executeAction(action);
    }
  }

  private executeAction(action: 'approve' | 'reject' | 'suspend' | 'delete') {
    if (!this.user) return;
    
    let obs$: import('rxjs').Observable<import('../../models/admin-user.model').ApiResponse<any>> | undefined;
    switch (action) {
      case 'approve':
        obs$ = this.adminUsersService.approveMember(this.user.id);
        break;
      case 'reject':
        obs$ = this.adminUsersService.rejectMember(this.user.id);
        break;
      case 'suspend':
        obs$ = this.adminUsersService.suspendMember(this.user.id);
        break;
      case 'delete':
        obs$ = this.adminUsersService.deleteMember(this.user.id);
        break;
    }

    if (!obs$) return;

    obs$.subscribe(async (res: any) => {
      if (action === 'delete') {
        this.location.back();
      } else {
        if ('status' in (res.data || {}) && this.user) {
          this.user.status = (res.data as any).status;
        }
      }
    });
  }

  getStatusColor(status: UserStatus | undefined): string {
    switch (status) {
      case UserStatus.ACTIVE: return 'success';
      case UserStatus.PENDING: return 'warning';
      case UserStatus.REJECTED: return 'danger';
      case UserStatus.SUSPENDED: return 'medium';
      default: return 'primary';
    }
  }

}
