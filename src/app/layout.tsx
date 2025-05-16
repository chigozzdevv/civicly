"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { embeddedWallet } from "@civic/auth-web3/wagmi";
import { mainnet } from "wagmi/chains";
import { CivicAuthProvider } from "@civic/auth-web3/nextjs";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./globals.css";

const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
  connectors: [embeddedWallet()],
});

const queryClient = new QueryClient();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={wagmiConfig}>
            <ConnectionProvider endpoint="https://api.devnet.solana.com">
              <WalletProvider wallets={[]} autoConnect>
                <WalletModalProvider>
                  <CivicAuthProvider>
                    {children}
                  </CivicAuthProvider>
                </WalletModalProvider>
              </WalletProvider>
            </ConnectionProvider>
          </WagmiProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}