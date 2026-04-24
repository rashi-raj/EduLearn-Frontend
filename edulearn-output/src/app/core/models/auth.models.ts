export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  mobile: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface UserPayload {
  userId?: string;
  fullName?: string;
  email?: string;
  role?: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  provider?: string;
  mobile?: string;
  bio?: string;
  profilePicUrl?: string;
  createdAt?: string;
}

export interface StoredUser {
  userId?: string;
  token?: string;
  email?: string;
  fullName?: string;
  role?: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  message?: string;
}

export interface AuthResponse {
  token?: string;
  tokenType?: string;
  user?: UserPayload;
  email?: string;
  message?: string;
}
