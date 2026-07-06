
export interface User {
    id: string;
    email: string;
    username: string;
}

export interface LoginRequest{
    username: string;
    password: string;
}

export interface RegisterRequest{
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    timezone: string;
}

export interface AuthResponse{
    user: User;
    token: string;
    refresh: string;
}

export interface RefreshRequest{
    refresh: string
}

export interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
}