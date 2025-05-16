import React, { ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@civic/auth-web3/react';
import Navigation from './navigation';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const userContext = useUser();
  const [selectedNetwork, setSelectedNetwork] = useState<'ethereum' | 'solana'>('solana');

  const handleLogout = async () => {
    if (userContext.signOut) {
      await userContext.signOut();
    }
    router.push('/');
  };

  const handleNetworkChange = (network: 'ethereum' | 'solana') => {
    setSelectedNetwork(network);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <Navigation 
        onLogout={handleLogout} 
        selectedNetwork={selectedNetwork} 
        onNetworkChange={handleNetworkChange} 
      />
      
      <div className="flex-1 md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<any>, { 
                selectedNetwork 
              });
            }
            return child;
          })}
        </div>
      </div>
    </div>
  );
}