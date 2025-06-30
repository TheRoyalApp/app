export interface User {
  id: string,
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  phone: string,
  isAdmin: boolean,
  role: 'customer' | 'staff',
  updatedAt: Date,
  createdAt: Date,
  refreshToken: string,
}

export interface UserResponse {
  data: User | User[] | null,
  error: string | null,
}