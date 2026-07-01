import { Component } from '@angular/core';
import { Sidebar } from '../../../components/sidebar/sidebar';
import { RouterOutlet } from '@angular/router';
import { Header } from '../../../components/header/header';

@Component({
  selector: 'app-authenticated-layout',
  imports: [Sidebar, RouterOutlet, Header],
  templateUrl: './authenticated-layout.component.html',
  styleUrl: './authenticated-layout.component.css',
})
export class AuthenticatedLayoutComponent {}
