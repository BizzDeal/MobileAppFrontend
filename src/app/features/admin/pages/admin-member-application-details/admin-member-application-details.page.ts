import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe, Location } from '@angular/common';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AdminUsersService } from '../../services/admin-users.service';
import { AdminBusinessesService } from '../../services/admin-businesses.service';
import { AdminMember, AdminUser, UserStatus } from '../../models/admin-user.model';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';
import { ProfileSkeletonComponent } from '../../../../shared/components/skeletons/profile-skeleton/profile-skeleton.component';
import { AdminLogoutButtonComponent } from '../../components/admin-logout-button/admin-logout-button.component';
import { getAvatarColor, getInitials } from '../../../../shared/utils/avatar.util';
import { AppBackButtonService } from '../../../../core/platform/app-back-button.service';
import { addIcons } from 'ionicons';
import { 
  callOutline, 
  logoWhatsapp, 
  mailOutline, 
  locationOutline, 
  checkmarkCircleOutline, 
  closeCircleOutline, 
  businessOutline, 
  documentTextOutline, 
  calendarOutline,
  personOutline,
  closeOutline,
  starOutline,
  star,
  trophyOutline,
  trophy,
  globeOutline,
  receiptOutline,
  arrowBackOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-admin-member-application-details',
  standalone: true,
  imports: [
    CommonModule, 
    IonicModule, 
    FormsModule, 
    DatePipe, 
    RouterModule, 
    CachedImgDirective, 
    ProfileSkeletonComponent, 
    AdminLogoutButtonComponent
  ],
  providers: [AdminUsersService],
  templateUrl: './admin-member-application-details.page.html',
  styleUrls: ['./admin-member-application-details.page.scss']
})
export class AdminMemberApplicationDetailsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly adminUsersService = inject(AdminUsersService);
  private readonly adminBusinessesService = inject(AdminBusinessesService);
  private readonly alertCtrl = inject(AlertController);
  private readonly toastCtrl = inject(ToastController);
  private readonly backButtonService = inject(AppBackButtonService);

  member: (AdminMember & { [key: string]: any }) | null = null;
  loading = true;
  actionLoading = false;
  isTop = false;
  showRejectInput = false;
  rejectionReason = '';
  UserStatus = UserStatus;

  constructor() {
    addIcons({
      callOutline,
      logoWhatsapp,
      mailOutline,
      locationOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      businessOutline,
      documentTextOutline,
      calendarOutline,
      personOutline,
      closeOutline,
      starOutline,
      star,
      trophyOutline,
      trophy,
      globeOutline,
      receiptOutline,
      arrowBackOutline
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadMember(id);
    } else {
      this.loading = false;
    }
  }

  loadMember(id: string): void {
    this.loading = true;
    this.adminUsersService.getUserById(id).subscribe({
      next: (res) => {
        this.member = res?.data as any;
        this.isTop = !!this.member?.is_top;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.backButtonService.back('/admin/users');
  }

  getInitials(name: string | null | undefined): string {
    return getInitials(name);
  }

  getAvatarColor(name: string | null | undefined): string {
    return getAvatarColor(name);
  }

  getStatusColor(status: UserStatus | string | undefined): string {
    switch (status) {
      case UserStatus.ACTIVE:
      case 'APPROVED':
        return 'success';
      case UserStatus.PENDING:
        return 'warning';
      case UserStatus.REJECTED:
        return 'danger';
      case UserStatus.SUSPENDED:
        return 'medium';
      default:
        return 'primary';
    }
  }

  approve(): void {
    if (!this.member || this.actionLoading) return;
    this.actionLoading = true;

    // Step 1: Member approval API completes first
    this.adminUsersService.approveMember(this.member.id).subscribe({
      next: () => {
        this.actionLoading = false;
        if (this.member) {
          this.member.status = UserStatus.ACTIVE;

          // Step 2: Once approval ends, update business top status if selected
          const businessId = this.member.business_id;
          if (businessId) {
            if (this.isTop) {
              this.adminBusinessesService.topBusiness(businessId, true).subscribe({
                next: () => {
                  if (this.member) this.member.is_top = true;
                }
              });
            }
          }
        }
      },
      error: () => {
        this.actionLoading = false;
      }
    });
  }

  onTopCheckboxChange(event: any): void {
    const checked = !!event?.detail?.checked;
    this.isTop = checked;

    // If member is already ACTIVE, update backend immediately
    if (this.member && this.member.status === UserStatus.ACTIVE && this.member.business_id) {
      this.adminBusinessesService.topBusiness(this.member.business_id, checked).subscribe({
        next: () => {
          if (this.member) this.member.is_top = checked;
        },
        error: () => {
          // Revert checkbox state on error
          this.isTop = !checked;
        }
      });
    }
  }

  toggleRejectInput(): void {
    this.showRejectInput = true;
  }

  cancelReject(): void {
    this.showRejectInput = false;
    this.rejectionReason = '';
  }

  reject(): void {
    const reason = this.rejectionReason.trim();
    if (!this.member || this.actionLoading || !reason) return;
    this.actionLoading = true;

    this.adminUsersService.rejectMember(this.member.id, reason).subscribe({
      next: () => {
        this.actionLoading = false;
        this.showRejectInput = false;
        if (this.member) {
          this.member.status = UserStatus.REJECTED;
          (this.member as any).rejection_reason = reason;
        }
      },
      error: () => {
        this.actionLoading = false;
      }
    });
  }
}
