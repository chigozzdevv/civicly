// next.config.ts
import { createCivicAuthPlugin } from "@civic/auth-web3/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

const withCivicAuth = createCivicAuthPlugin({
  clientId: "4ec7d18d-2300-48e2-8956-c79f7558b750",
  loginSuccessUrl: "/dashboard",
  callbackUrl: "/api/auth/callback", 
  loginUrl: "/login",
  logoutUrl: "/",
  enableSolanaWalletAdapter: true
});

export default withCivicAuth(nextConfig);