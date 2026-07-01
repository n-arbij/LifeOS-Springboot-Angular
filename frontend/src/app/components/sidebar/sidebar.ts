import { Component, inject } from '@angular/core';
import { SidebarItem } from '../../core/models/sidebar-item.model';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  readonly sidebarItems = SIDEBAR_ITEMS;
  private authService = inject(AuthService);

  logout(): void {
      this.authService.logout();
  }
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
    {
        label: 'Dashboard',
        icon: 'dashboard',
        route: '/app/dashboard'
    },
    {
        label: 'Events',
        icon: 'calendar-event',
        route: '/app/events'
    },
    {
        label: 'Habits',
        icon: 'check-square',
        route: '/app/habits'
    },
    {
        label: 'Journals',
        icon: 'book',
        route: '/app/journals'
    },
    {
        label: 'Settings',
        icon: 'cog',
        route: '/app/settings'
    }
]
