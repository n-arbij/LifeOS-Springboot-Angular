import { Routes } from '@angular/router';
import { guestGuard } from './core/guards/guest.guard';
import { PublicLayout } from './layout/public/public-layout/public-layout';
import { AuthenticatedLayoutComponent } from './layout/authenticated/authenticated-layout/authenticated-layout.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        component: PublicLayout,
        canActivate: [guestGuard],
        children: [
             {
                path: '',
                redirectTo: 'login',
                pathMatch: 'full'
            },
            {
                path: 'login',
                loadComponent: () => 
                    import('./features/auth/pages/login/login.component')
                        .then(c => c.LoginComponent)
            },
            {
                path: 'register',
                loadComponent: () => 
                    import('./features/auth/pages/register/register.component')
                        .then(c => c.RegisterComponent)
            }
        ]
    },

    {
        path: 'app',
        component: AuthenticatedLayoutComponent,
        canActivate: [authGuard],
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                loadComponent: () => 
                    import('./features/dashboard/dashboard.component')
                        .then(c=> c.DashboardComponent)
            }
        ]
    }
];