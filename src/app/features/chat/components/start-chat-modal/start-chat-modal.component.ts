import { ChangeDetectionStrategy, Component, computed, inject, Input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSearchbar,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, personOutline, searchOutline } from 'ionicons/icons';
import { ChatPartner } from '../../models/chat.model';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-start-chat-modal',
  standalone: true,
  imports: [
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
    IonLabel
  ],
  templateUrl: './start-chat-modal.component.html',
  styleUrl: './start-chat-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartChatModalComponent {
  private readonly chatService = inject(ChatService);

  // Output action to dismiss modal
  @Input() dismiss = () => { };

  // Output selection action
  @Input() selectPartner = (partnerId: string) => { };

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
