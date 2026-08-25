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
  walletOutline,
  briefcase,
  briefcaseOutline,
  menu,
  menuOutline,
  pricetagOutline,
  calendar,
  calendarOutline,
  people,
  peopleOutline,
  ticket,
  ticketOutline,
  grid,
  gridOutline
} from 'ionicons/icons';

export type NavTab = 'home' | 'search' | 'chat' | 'wallet' | 'profile' | 'meetings' | 'menu' | 'referrals' | 'vouchers' | 'categories';

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
  readonly role = input<'CUSTOMER' | 'MEMBER' | 'ADMIN'>('CUSTOMER');
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
      person,
      briefcase,
      briefcaseOutline,
      menu,
      menuOutline,
      pricetagOutline,
      calendar,
      calendarOutline,
      people,
      peopleOutline,
      ticket,
      ticketOutline,
      grid,
      gridOutline
    });
  }
}

