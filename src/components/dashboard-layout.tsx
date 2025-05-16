import React from 'react';
import { useUser } from '@civic/auth-web3/react';
import Navigation from './navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
  selectedNetwork?: 'ethereum' | 'solana';
  onNetworkChange?: (network: 'ethereum' | 'solana') => void;
}

export default function DashboardLayout({ 
  children, 
  selectedNetwork = 'solana', 
  onNetworkChange = () => {} 
}: DashboardLayoutProps) {
  const { signOut } = useUser();

  const handleLogout = async () => {
    if (typeof signOut === 'function') {
      await signOut();
    } else {
      window.location.href = '/api/auth/logout';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation 
        onLogout={handleLogout} 
        selectedNetwork={selectedNetwork} 
        onNetworkChange={onNetworkChange} 
      />
      
      <div className="md:ml-64 pt-4 md:pt-0 pb-16 md:pb-0">
        <div className="md:mt-6">
          {children}
        </div>
      </div>
    </div>
  );
}