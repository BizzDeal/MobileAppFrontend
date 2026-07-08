import { Component, ChangeDetectionStrategy, inject, signal, computed, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonButton, 
  IonIcon, 
  IonContent, 
  IonSearchbar, 
  IonList, 
  IonItem, 
  IonAvatar, 
  IonLabel 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, searchOutline, personOutline } from 'ionicons/icons';
import { ChatService } from '../../services/chat.service';
import { ChatPartner } from '../../models/chat.model';

@Component({
  selector: 'app-start-chat-modal',
  standalone: true,
  imports: [
    NgClass,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonSearchbar,
    IonList,
    IonItem,
    IonAvatar,
    IonLabel
  ],
  templateUrl: './start-chat-modal.component.html',
  styleUrl: './start-chat-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartChatModalComponent {
  private readonly chatService = inject(ChatService);
  
  // Output action to dismiss modal
  @Input() dismiss = () => {}; 
  
  // Output selection action
  @Input() selectPartner = (partnerId: string) => {};

  readonly searchQuery = signal<string>('');

  readonly filteredContacts = computed(() => {
    const contacts = this.chatService.contactsDirectory;
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return contacts;
    return contacts.filter(
      c => c.full_name.toLowerCase().includes(query) || 
           c.phone.toLowerCase().includes(query)
    );
  });

  constructor() {
    addIcons({ closeOutline, searchOutline, personOutline });
  }

  onSearchChange(event: any): void {
    const val = event.target?.value ?? event.detail?.value ?? '';
    this.searchQuery.set(val);
  }

  onSelect(partner: ChatPartner): void {
    this.selectPartner(partner.id);
    this.dismiss();
  }
}
