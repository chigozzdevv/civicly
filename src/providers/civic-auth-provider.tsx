"use client";

import React, { ReactNode } from 'react';
import { CivicAuthProvider } from '@civic/auth-web3/nextjs';
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

interface CivicAuthProviderProps {
  children: ReactNode;
}

export default function CivicAuthWrapper({ children }: CivicAuthProviderProps) {
  const clientID = process.env.NEXT_PUBLIC_CIVIC_CLIENT_ID;
  const endpoint = "https://api.devnet.solana.com";
  
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          <CivicAuthProvider>
            {children}
          </CivicAuthProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}