import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Edge-runtime middleware enforces the `authorized` callback in auth.config.
export const { auth: middleware } = NextAuth(authConfig);

export default middleware((req) => {
  // The `authorized` callback handles redirects; nothing else needed here.
  void req;
});

export const config = {
  // Run on everything except static assets and API auth internals.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
