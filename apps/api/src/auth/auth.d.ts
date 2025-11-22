export interface User {
    id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    isAdmin: boolean;
    role: 'customer' | 'staff';
    refreshToken?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateUserRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: 'customer' | 'staff' | 'admin';
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface RequestPasswordResetRequest {
    email: string;
}

export interface VerifyResetTokenRequest {
    token: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}
