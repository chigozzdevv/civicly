// components/navigation.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Coins, LogOut, Home, MessageSquare, Trophy, Wallet } from 'lucide-react';
import NetworkSwitcher from './network-switcher';

interface NavigationProps {
  onLogout: () => void;
  selectedNetwork: 'ethereum' | 'solana';
  onNetworkChange: (network: 'ethereum' | 'solana') => void;
}

export default function Navigation({ onLogout, selectedNetwork, onNetworkChange }: NavigationProps) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r border-neutral-200 h-screen fixed">
        <div className="p-4 border-b border-neutral-200">
          <Link href="/" className="flex items-center">
            <div className="bg-neutral-900 h-8 w-8 rounded flex items-center justify-center text-white font-bold">
              C
            </div>
            <span className="ml-2 text-xl font-semibold">Civicly</span>
          </Link>
        </div>
        
        <div className="p-4 border-b border-neutral-200">
          <NetworkSwitcher 
            selectedNetwork={selectedNetwork} 
            onChange={onNetworkChange} 
          />
        </div>
        
        <div className="flex-1 py-4">
          <nav className="px-4 space-y-1">
            <Link 
              href="/dashboard" 
              className={`flex items-center px-2 py-2 rounded-md ${
                isActive('/dashboard') 
                  ? 'text-neutral-900 bg-neutral-100' 
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <Home className="mr-3 h-5 w-5 text-neutral-500" />
              Dashboard
            </Link>
            
            <Link 
              href="/wallet" 
              className={`flex items-center px-2 py-2 rounded-md ${
                isActive('/wallet') 
                  ? 'text-neutral-900 bg-neutral-100' 
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <Wallet className="mr-3 h-5 w-5 text-neutral-500" />
              My Wallet
            </Link>
            
            <Link 
              href="/messages" 
              className={`flex items-center px-2 py-2 rounded-md ${
                isActive('/messages') 
                  ? 'text-neutral-900 bg-neutral-100' 
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <MessageSquare className="mr-3 h-5 w-5 text-neutral-500" />
              Message Board
            </Link>
            
            <Link 
              href="/staking" 
              className={`flex items-center px-2 py-2 rounded-md ${
                isActive('/staking') 
                  ? 'text-neutral-900 bg-neutral-100' 
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <Coins className="mr-3 h-5 w-5 text-neutral-500" />
              Staking
            </Link>
            
            <Link 
              href="/leaderboard" 
              className={`flex items-center px-2 py-2 rounded-md ${
                isActive('/leaderboard') 
                  ? 'text-neutral-900 bg-neutral-100' 
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <Trophy className="mr-3 h-5 w-5 text-neutral-500" />
              Leaderboard
            </Link>
          </nav>
        </div>
        
        <div className="p-4 border-t border-neutral-200">
          <button
            onClick={onLogout}
            className="flex items-center px-2 py-2 w-full text-neutral-600 hover:bg-neutral-100 rounded-md"
          >
            <LogOut className="mr-3 h-5 w-5 text-neutral-500" />
            Logout
          </button>
        </div>
      </div>
      
      {/* Mobile header - visible only on mobile */}
      <div className="md:hidden fixed top-0 inset-x-0 z-10 bg-white border-b border-neutral-200 p-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <div className="bg-neutral-900 h-8 w-8 rounded flex items-center justify-center text-white font-bold">
              C
            </div>
            <span className="ml-2 text-xl font-semibold">Civicly</span>
          </Link>
          
          <div className="flex items-center">
            <NetworkSwitcher 
              selectedNetwork={selectedNetwork} 
              onChange={onNetworkChange}
              minimal={true} 
            />
            <button
              onClick={onLogout}
              className="p-2 ml-2 text-neutral-600 hover:text-neutral-900"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile bottom navigation - visible only on mobile */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-10 bg-white border-t border-neutral-200 p-2">
        <div className="flex justify-around">
          <Link 
            href="/dashboard" 
            className={`p-2 flex flex-col items-center ${isActive('/dashboard') ? 'text-neutral-900' : 'text-neutral-600'}`}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs mt-1">Dashboard</span>
          </Link>
          
          <Link 
            href="/wallet" 
            className={`p-2 flex flex-col items-center ${isActive('/wallet') ? 'text-neutral-900' : 'text-neutral-600'}`}
          >
            <Wallet className="h-6 w-6" />
            <span className="text-xs mt-1">Wallet</span>
          </Link>
          
          <Link 
            href="/messages" 
            className={`p-2 flex flex-col items-center ${isActive('/messages') ? 'text-neutral-900' : 'text-neutral-600'}`}
          >
            <MessageSquare className="h-6 w-6" />
            <span className="text-xs mt-1">Messages</span>
          </Link>
          
          <Link 
            href="/staking" 
            className={`p-2 flex flex-col items-center ${isActive('/staking') ? 'text-neutral-900' : 'text-neutral-600'}`}
          >
            <Coins className="h-6 w-6" />
            <span className="text-xs mt-1">Staking</span>
          </Link>
        </div>
      </div>
    </>
  );
}