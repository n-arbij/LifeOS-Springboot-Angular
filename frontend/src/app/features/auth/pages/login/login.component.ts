import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { LoginRequest } from '../../../../core/models/auth.model';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterLink
    ],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent {

    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    loading = false;

    loginForm = this.fb.group({
        username: ['', [Validators.required]],
        password: ['', Validators.required],
        rememberMe: [false]
    });

    get username() {
        return this.loginForm.controls.username;
    }
    get password() {
        return this.loginForm.controls.password;
    }

    login() {
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();

            return;
        }

        this.loading = true;

        const request: LoginRequest = {
            username: this.username.value!,
            password: this.password.value!
        };

        this.authService.login(request)
            .pipe(
                finalize(() => this.loading = false)
            )
            .subscribe({
                next: () => {
                    const returnUrl =
                        this.route.snapshot.queryParamMap.get('returnUrl');

                    this.router.navigateByUrl(
                        returnUrl ?? '/dashboard'
                    );
                },

                error: error => {
                    console.error(error);
                }
            });
    }

}