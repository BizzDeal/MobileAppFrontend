import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, caretDownOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { MemberRegistrationService } from './member-registration.service';
import { CachedImgDirective } from '../../../../shared/directives/cached-img.directive';

@Component({
  selector: 'app-member-registration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonInput,
    IonModal,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    CachedImgDirective
  ],
  providers: [MemberRegistrationService],
  templateUrl: './member-registration.page.html',
  styleUrl: './member-registration.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberRegistrationPage {
  readonly regService = inject(MemberRegistrationService);

  constructor() {
    addIcons({
      'camera-outline': cameraOutline,
      'caret-down-outline': caretDownOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
    });
  }
}
