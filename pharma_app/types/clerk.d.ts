import { User } from "@clerk/nextjs/server";

declare module "@clerk/nextjs/server" {
  interface PublicMetadata {
    role: "ADMIN" | "USER";
  }
}

export interface ClerkUser extends User {
  publicMetadata: {
    role: "ADMIN" | "USER";
  };
} 