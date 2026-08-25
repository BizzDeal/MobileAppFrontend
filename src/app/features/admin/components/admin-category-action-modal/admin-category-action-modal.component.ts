import { Component, Input, OnInit } from '@angular/core';

import { IonicModule, ModalController } from '@ionic/angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { addIcons } from 'ionicons';
import { closeOutline, saveOutline, trashOutline } from 'ionicons/icons';

@Component({
  selector: 'app-admin-category-action-modal',
  standalone: true,
  imports: [IonicModule, ReactiveFormsModule],
  templateUrl: './admin-category-action-modal.component.html',
  styleUrls: ['./admin-category-action-modal.component.scss']
})
export class AdminCategoryActionModalComponent implements OnInit {
  @Input() category: any;
  
  categoryForm!: FormGroup;
  isEditMode = false;

  constructor(
    private modalCtrl: ModalController,
    private fb: FormBuilder
  ) {
    addIcons({ closeOutline, saveOutline, trashOutline });
  }

  ngOnInit() {
    this.isEditMode = !!this.category;
    
    this.categoryForm = this.fb.group({
      name: [this.category?.name || '', [Validators.required, Validators.minLength(2)]],
      icon: [this.category?.icon || '🏷️'],
      description: [this.category?.description || ''],
      is_active: [this.category ? this.category.is_active : true]
    });
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  submit() {
    if (this.categoryForm.valid) {
      this.modalCtrl.dismiss({
        action: 'save',
        data: this.categoryForm.value
      });
    } else {
      this.categoryForm.markAllAsTouched();
    }
  }

  delete() {
    this.modalCtrl.dismiss({
      action: 'delete'
    });
  }
}
