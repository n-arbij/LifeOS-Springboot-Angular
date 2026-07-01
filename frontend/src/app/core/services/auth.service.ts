import { HttpClient } from "@angular/common/http";
import { computed, inject, Injectable, signal } from "@angular/core";
import { Router } from "@angular/router";
import { TokenService } from "./token.service";
import { StorageService } from "./storage.service";
import { environment } from "../../../environments/environment";
import { AuthResponse, LoginRequest, RefreshRequest, RegisterRequest } from "../models/auth.model";
import { catchError, map, Observable, of, take, tap, throwError } from "rxjs";
import { User } from "../models/user.model";

@Injectable({providedIn: 'root'})
export class AuthService{
    private http = inject(HttpClient);
    private router = inject(Router);
    private tokenService = inject(TokenService);
    private storageService = inject(StorageService);
    
    private readonly API = `${environment.apiUrl}/auth`;

    private currentUserSignal = signal<User | null>(
        this.storageService.get<User>('user')
    )

    readonly currentUser = this.currentUserSignal.asReadonly();

    authenticated (): boolean {
        const token = this.tokenService.getAccessToken();
        if(token == null){
            return false;
        }

        return(
            this.currentUserSignal() !== null &&
            this.tokenService.isAccessTokenExpired() == false
        )
    }

    login(request: LoginRequest): Observable<AuthResponse> {
        return this.http
            .post<AuthResponse>(`${this.API}/login`, request)
            .pipe(
                tap( response => {
                    this.tokenService.setAccessToken(response.token);
                    this.tokenService.setRefreshToken(response.refresh);
                    this.storageService.set('user', response.user);
                    this.currentUserSignal.set(response.user)
                })
            );
    }

    register(request: RegisterRequest): Observable<AuthResponse> {
        return this.http
            .post<AuthResponse>(`${this.API}/register`, request)
            .pipe(
                tap(response => {
                    this.tokenService.setAccessToken(response.token);
                    this.tokenService.setRefreshToken(response.refresh);
                    this.storageService.set('user', response.user);
                    this.currentUserSignal.set(response.user)
                })
            );
    }

    refreshToken(): Observable<AuthResponse> {

        const refreshToken = this.tokenService.getRefreshToken();

        if(!refreshToken) {
            this.logout();

            return throwError(() => 
                new Error('Refresh token not found.')
            )
        }

        if(this.tokenService.isRefreshTokenExpired()){
            this.logout();

            return throwError(() => 
                new Error('Refresh token has expired.')
            )
        }

        return this.http
            .post<AuthResponse>(`${this.API}/refresh`, 
                {
                    refreshToken: this.tokenService.getRefreshToken()
                }
            ).pipe(
                tap(response => {
                    this.tokenService.setAccessToken(response.token);
                    this.tokenService.setRefreshToken(response.refresh);
                })
            );
    }

    logout(): void {
        this.tokenService.clear();
        this.storageService.remove('user');
        this.currentUserSignal.set(null);

        if(this.router.url !== '/login'){
            this.router.navigate(['/login']);
        }
    }

    initialize(): Observable<void> {
        const user = this.storageService.get<User>('user');

        if(user){
            this.currentUserSignal.set(user);
        }

        const refreshToken = this.tokenService.getRefreshToken();

        if(!refreshToken){
            return of(void 0);
        }

        if(this.tokenService.isRefreshTokenExpired()){
            this.logout();
            return of(void 0)
        }

        return this.refreshToken().pipe(
            map(() => void 0),
            catchError(() => {
                this.logout();
                return of(void 0);
            })
        );
    }

    getCurrentUser(): User | null{
        return this.currentUserSignal();
    }

    getAccessToken(): string | null{
        return this.tokenService.getAccessToken();
    }

    isAccessTokenExpired(): boolean {
        return this.tokenService.isAccessTokenExpired();
    }
}