import "next-auth";
import "next-auth/jwt";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    login?: string;
    orgs: string[];
    user?: DefaultSession["user"] & {
      login?: string;
      orgs?: string[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    login?: string;
    orgs?: string[];
  }
}
