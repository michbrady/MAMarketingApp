/**
 * Express type definitions
 */

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
        firstName: string;
        lastName: string;
        roleId: number;
        roleName: string;
        role: string;
        market?: string;
      };
    }
  }
}

export {};
