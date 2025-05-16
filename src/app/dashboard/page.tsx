"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUser } from '@civic/auth-web3/react';
import { userHasWallet } from '@civic/auth-web3';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useAccount } from 'wagmi';
import { TextEncoder } from 'util';
import DashboardLayout from '@/components/dashboard-layout';
import DailyCheckin from '@/components/daily-checkin';
import DashboardStats from '@/components/dashboard-stats';
import { Wallet } from 'lucide-react';

interface UserData {
  points: number;
  streak: number;
  lastCheckIn: string | null;
  leaderboardRank?: number;
}

export default function DashboardPage({ selectedNetwork = 'solana' }: { selectedNetwork?: 'ethereum' | 'solana' }) {
  const router = useRouter();
  const userContext = useUser();
  const { publicKey, signMessage } = useWallet();
  const { connection } = useConnection();
  const { address: ethAddress } = useAccount();
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [isWalletCreating, setIsWalletCreating] = useState(false);
  
  const isAuthenticated = !!userContext.user;
  const hasWallet = userContext && userHasWallet(userContext);

  // Protect route
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Create wallet if needed
  useEffect(() => {
    const createWalletIfNeeded = async () => {
      if (userContext.user && !userHasWallet(userContext) && !isWalletCreating) {
        try {
          setIsWalletCreating(true);
          // Only call createWallet if it exists (on NewWeb3UserContext)
          if ('createWallet' in userContext) {
            await userContext.createWallet();
            console.log("Wallet created successfully");
          }
        } catch (error) {
          console.error("Error creating wallet:", error);
        } finally {
          setIsWalletCreating(false);
        }
      }
    };
    
    createWalletIfNeeded();
  }, [userContext, isWalletCreating]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!hasWallet) return;
      
      // Safely access the wallet address based on type
      let walletAddress;
      if (selectedNetwork === 'ethereum') {
        if ('ethereum' in userContext) {
          walletAddress = userContext.ethereum.address;
        } else if (ethAddress) {
          walletAddress = ethAddress;
        }
      } else { // solana
        if ('solana' in userContext) {
          walletAddress = userContext.solana.address;
        } else if (publicKey) {
          walletAddress = publicKey.toString();
        }
      }
      
      if (!walletAddress) return;
      
      try {
        const response = await fetch(`/api/user-data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress,
            network: selectedNetwork
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserData(data.user);
          
          // Check if already checked in today
          if (data.user.lastCheckIn) {
            const lastCheckIn = new Date(data.user.lastCheckIn);
            const today = new Date();
            
            if (
              lastCheckIn.getDate() === today.getDate() &&
              lastCheckIn.getMonth() === today.getMonth() &&
              lastCheckIn.getFullYear() === today.getFullYear()
            ) {
              setCheckedInToday(true);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    
    fetchUserData();
  }, [hasWallet, userContext, publicKey, ethAddress, selectedNetwork]);

  // Handle daily check in
  const handleDailyCheckIn = async () => {
    if (!hasWallet) return;
    
    let signature;
    let walletAddress;
    
    setIsCheckingIn(true);
    try {
      // Create message to sign
      const today = new Date().toISOString();
      const message = `Civicly daily check-in: ${today}`;
      
      // Sign with the appropriate wallet based on network
      if (selectedNetwork === 'ethereum') {
        if ('ethereum' in userContext) {
          // Fixed Ethereum wallet signing with correct parameters
          signature = await userContext.ethereum.wallet.signMessage({
            message,
            account: userContext.ethereum.address
          });
          walletAddress = userContext.ethereum.address;
        } else {
          throw new Error("No Ethereum wallet available for signing");
        }
      } else { // Solana
        const encodedMessage = new TextEncoder().encode(message);
        if ('solana' in userContext) {
          signature = await userContext.solana.wallet.signMessage(encodedMessage);
          walletAddress = userContext.solana.address;
        } else if (signMessage && publicKey) {
          signature = await signMessage(encodedMessage);
          walletAddress = publicKey.toString();
        } else {
          throw new Error("No Solana wallet available for signing");
        }
      }
      
      // Send to backend
      const response = await fetch('/api/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          signature: selectedNetwork === 'ethereum' 
            ? signature 
            : Buffer.from(signature).toString('base64'),
          message,
          network: selectedNetwork
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserData(data.user);
        setCheckedInToday(true);
        setPointsEarned(data.pointsEarned);
      } else {
        const errorData = await response.json();
        console.error('Check-in error:', errorData.error);
      }
    } catch (error) {
      console.error("Check-in error:", error);
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Get wallet address safely based on selected network
  const getWalletAddress = () => {
    if (selectedNetwork === 'ethereum') {
      if ('ethereum' in userContext) {
        return userContext.ethereum.address;
      } else if (ethAddress) {
        return ethAddress;
      }
    } else { // solana
      if ('solana' in userContext) {
        return userContext.solana.address;
      } else if (publicKey) {
        return publicKey.toString();
      }
    }
    return 'No wallet';
  };

  const walletAddress = getWalletAddress();

  if (!isAuthenticated) {
    return null; 
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-6">Dashboard</h1>
      </motion.div>
      
      {!hasWallet && !isWalletCreating && (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-8">
          <div className="flex flex-col items-center">
            <Wallet className="h-16 w-16 text-blue-500 mb-4" />
            <h3 className="text-xl font-medium text-neutral-900 mb-2">Creating your wallet...</h3>
            <p className="text-neutral-600 text-center">
              Please wait while we set up your Web3 wallet.
            </p>
          </div>
        </div>
      )}
      
      {hasWallet && userData && (
        <>
          <DashboardStats 
            totalPoints={userData.points || 0}
            leaderboardRank={userData.leaderboardRank || 99}
            pointsToday={pointsEarned || 0}
            pointsTrend={7}
          />
          
          <DailyCheckin
            userData={userData}
            walletAddress={walletAddress}
            checkedInToday={checkedInToday}
            pointsEarned={pointsEarned}
            isCheckingIn={isCheckingIn}
            onCheckIn={handleDailyCheckIn}
            network={selectedNetwork}
          />
        </>
      )}
    </DashboardLayout>
  );
}