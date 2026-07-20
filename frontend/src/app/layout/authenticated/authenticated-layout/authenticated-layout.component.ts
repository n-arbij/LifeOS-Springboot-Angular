import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../../../components/header/header';

@Component({
  selector: 'app-authenticated-layout',
  imports: [RouterOutlet, Header],
  templateUrl: './authenticated-layout.component.html',
  styleUrl: './authenticated-layout.component.css',
})
export class AuthenticatedLayoutComponent {}
