import type { DefaultSession } from "next-auth";

/**
 * Two roles: "ADMIN" (the owner/staff portal) and "CUSTOMER" (a wholesale /
 * regular customer's read-only self-service portal). For CUSTOMER sessions
 * `customerId` carries which Customer row they are, so their pages can scope
 * every query to their own data.
 */
type Role = "ADMIN" | "CUSTOMER";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      customerId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    customerId?: string;
  }
}

// next-auth/jwt is a pure re-export of @auth/core/jwt, so the JWT interface
// must be augmented at its source module for the callbacks to be typed.
declare module "@auth/core/jwt" {
  interface JWT {
    role: Role;
    customerId?: string;
  }
}
