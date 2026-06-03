import type { NextAuthConfig } from "next-auth";
import type { Plan, Role } from "@prisma/client";

/**
 * Edge-safe auth configuration shared between the Node runtime (`auth.ts`)
 * and the middleware. It must NOT import Prisma, bcrypt, or any Node-only
 * module, because the middleware runs on the Edge runtime.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  trustHost: true,
  // Providers are added in the Node config; left empty here so the middleware
  // bundle stays edge-compatible.
  providers: [],
  callbacks: {
    // Route protection for the middleware matcher.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const path = nextUrl.pathname;
      const isProtected =
        path.startsWith("/dashboard") ||
        path.startsWith("/documents") ||
        path.startsWith("/billing") ||
        path.startsWith("/settings");
      const isAuthPage = path === "/login" || path === "/register";

      if (isProtected && !isLoggedIn) return false; // redirect to signIn
      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: Role }).role ?? "USER";
        token.plan = (user as { plan?: Plan }).plan ?? "FREE";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as Role) ?? "USER";
        session.user.plan = (token.plan as Plan) ?? "FREE";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
