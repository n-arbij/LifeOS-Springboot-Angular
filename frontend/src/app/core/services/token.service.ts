import { inject, Injectable } from "@angular/core";
import { StorageService } from "./storage.service";
import { jwtDecode } from 'jwt-decode';
import { JwtPayload } from "../models/jwt-payload.model";

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly ACCESS  = 'access_token';
  private readonly REFRESH = 'refresh_token';

  private storageService = inject(StorageService);

  setAccessToken(token: string): void {
    this.storageService.set(this.ACCESS, token);
  }

  setRefreshToken(token: string): void {
    this.storageService.set(this.REFRESH, token);
  }

  getAccessToken(): string | null {
    return this.storageService.get<string>(this.ACCESS);
  }

  getRefreshToken(): string | null {
    return this.storageService.get<string>(this.REFRESH);
  }

  clear(): void {
    this.storageService.remove(this.ACCESS);
    this.storageService.remove(this.REFRESH);
  }

  decode(token: string): JwtPayload | null {
    try {
      return jwtDecode<JwtPayload>(token);
    } catch {
      return null;
    }
  }

  isExpired(token: string): boolean {
    const payload = this.decode(token);
    if (!payload) return true;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp <= now;
  }

  isAccessTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;
    return this.isExpired(token);
  }

  isRefreshTokenExpired(): boolean {
    const token = this.getRefreshToken();
    return token === null;
  }
}