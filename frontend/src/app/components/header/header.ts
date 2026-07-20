import { Component, inject } from '@angular/core';
import { NavbarItem } from '../../core/models/navbar-item.model';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

export const NAVBAR_ITEMS: NavbarItem[] = [
    {
        label: 'Dashboard',
        route: '/app/dashboard'
    },
    {
        label: 'Events',
        route: '/app/events'
    },
    {
        label: 'Habits',
        route: '/app/habits'
    },
    {
        label: 'Journals',
        route: '/app/journals'
    },
    {
        label: 'Timer',
        route: '/app/time'
    },
    {
        label: 'Settings',
        route: '/app/settings'
    }
]

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
    readonly navbarItems = NAVBAR_ITEMS;
    private authService = inject(AuthService);

    logout(): void {
        this.authService.logout();
    }
}
