// middleware.ts
import { authMiddleware } from "@civic/auth-web3/nextjs/middleware";

export default authMiddleware();

export const config = {
  matcher: [
    "/((?!_next|api/auth|auth|login|callback|signin|signout|favicon.ico|sitemap.xml|robots.txt|.*\\.jpg|.*\\.png|.*\\.svg|.*\\.gif).*)",
  ],
};