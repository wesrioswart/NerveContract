// Define the User type based on our database schema
export interface User {
  id: number;
  username: string;
  password: string;
  fullName: string;
  role: string;
  email: string;
  avatarInitials: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
      isAuthenticated(): boolean;
      login(user: User, done: (err: any) => void): void;
      logout(done: (err: any) => void): void;
    }
  }
}

export {};