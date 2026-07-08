import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chatbubble,
  chatbubbleOutline,
  home,
  homeOutline,
  person,
  personOutline,
  search,
  searchOutline,
  wallet,
  walletOutline
} from 'ionicons/icons';

export type NavTab = 'home' | 'search' | 'chat' | 'wallet' | 'profile';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [IonIcon],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomNavComponent {
  readonly activeTab = input<NavTab>('home');
  readonly tabSelect = output<NavTab>();

  constructor() {
    addIcons({ 
      homeOutline, 
      home, 
      searchOutline, 
      search, 
      chatbubbleOutline, 
      chatbubble, 
      walletOutline, 
      wallet, 
      personOutline, 
      person 
    });
  }
}
