"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Coins, LogOut, Wallet, CalendarCheck, MessageSquare, Trophy, CheckCircle, CircleAlert, Clock, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@civic/auth-web3/react';
import { userHasWallet } from '@civic/auth-web3';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { TextEncoder } from 'util';

interface UserData {
  points: number;
  streak: number;
  lastCheckIn: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const userContext = useUser();
  const { publicKey, signMessage } = useWallet();
  const { connection } = useConnection();
  
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
      if (hasWallet && 'solana' in userContext) {
        walletAddress = userContext.solana.address;
      } else if (publicKey) {
        walletAddress = publicKey.toString();
      } else {
        return; // No wallet address available
      }
      
      try {
        const response = await fetch(`/api/auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress: walletAddress,
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
  }, [hasWallet, userContext, publicKey]);

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
      const encodedMessage = new TextEncoder().encode(message);
      
      // Sign with the appropriate wallet (Solana embedded or adapter)
      if ('solana' in userContext) {
        signature = await userContext.solana.wallet.signMessage(encodedMessage);
        walletAddress = userContext.solana.address;
      } else if (signMessage && publicKey) {
        signature = await signMessage(encodedMessage);
        walletAddress = publicKey.toString();
      } else {
        throw new Error("No wallet available for signing");
      }
      
      // Send to backend
      const response = await fetch('/api/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: walletAddress,
          signature: Buffer.from(signature).toString('base64'),
          message,
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

  const handleLogout = async () => {
    if (userContext.signOut) {
      await userContext.signOut();
    }
    router.push('/');
  };

  if (!isAuthenticated) {
    return null; 
  }

  // Get wallet address safely
  const getWalletAddress = () => {
    if (hasWallet && 'solana' in userContext) {
      return userContext.solana.address;
    } else if (publicKey) {
      return publicKey.toString();
    }
    return 'No wallet';
  };

  const walletAddress = getWalletAddress();

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r border-neutral-200">
        <div className="p-4 border-b border-neutral-200">
          <Link href="/" className="flex items-center">
            <div className="bg-neutral-900 h-8 w-8 rounded flex items-center justify-center text-white font-bold">
              C
            </div>
            <span className="ml-2 text-xl font-semibold">Civicly</span>
          </Link>
        </div>
        
        <div className="flex-1 py-4">
          <nav className="px-4 space-y-1">
            <Link href="/dashboard" className="flex items-center px-2 py-2 text-neutral-900 rounded-md bg-neutral-100">
              <CalendarCheck className="mr-3 h-5 w-5 text-neutral-500" />
              Daily Check-in
            </Link>
            <Link href="/messages" className="flex items-center px-2 py-2 text-neutral-600 hover:bg-neutral-100 rounded-md">
              <MessageSquare className="mr-3 h-5 w-5 text-neutral-500" />
              Message Board
            </Link>
            <Link href="/staking" className="flex items-center px-2 py-2 text-neutral-600 hover:bg-neutral-100 rounded-md">
              <Coins className="mr-3 h-5 w-5 text-neutral-500" />
              Staking
            </Link>
            <Link href="/leaderboard" className="flex items-center px-2 py-2 text-neutral-600 hover:bg-neutral-100 rounded-md">
              <Trophy className="mr-3 h-5 w-5 text-neutral-500" />
              Leaderboard
            </Link>
          </nav>
        </div>
        
        <div className="p-4 border-t border-neutral-200">
          <button
            onClick={handleLogout}
            className="flex items-center px-2 py-2 w-full text-neutral-600 hover:bg-neutral-100 rounded-md"
          >
            <LogOut className="mr-3 h-5 w-5 text-neutral-500" />
            Logout
          </button>
        </div>
      </div>
      
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 inset-x-0 z-10 bg-white border-b border-neutral-200 p-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <div className="bg-neutral-900 h-8 w-8 rounded flex items-center justify-center text-white font-bold">
              C
            </div>
            <span className="ml-2 text-xl font-semibold">Civicly</span>
          </Link>
          
          <button
            onClick={handleLogout}
            className="p-2 text-neutral-600 hover:text-neutral-900"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Mobile navigation */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-10 bg-white border-t border-neutral-200 p-2">
        <div className="flex justify-around">
          <Link href="/dashboard" className="p-2 text-neutral-900 flex flex-col items-center">
            <CalendarCheck className="h-6 w-6" />
            <span className="text-xs mt-1">Check-in</span>
          </Link>
          <Link href="/messages" className="p-2 text-neutral-600 flex flex-col items-center">
            <MessageSquare className="h-6 w-6" />
            <span className="text-xs mt-1">Messages</span>
          </Link>
          <Link href="/staking" className="p-2 text-neutral-600 flex flex-col items-center">
            <Coins className="h-6 w-6" />
            <span className="text-xs mt-1">Staking</span>
          </Link>
          <Link href="/leaderboard" className="p-2 text-neutral-600 flex flex-col items-center">
            <Trophy className="h-6 w-6" />
            <span className="text-xs mt-1">Leaders</span>
          </Link>
        </div>
      </div>
      
      <div className="flex-1 md:ml-64 pt-16 md:pt-0">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-6">Daily Check-in</h1>
            
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
            
            {hasWallet && (
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden mb-8">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-medium text-neutral-900">Welcome back!</h2>
                      <p className="text-neutral-600">Check in daily to earn points and climb the leaderboard</p>
                    </div>
                    
                    <div className="mt-4 md:mt-0 flex items-center space-x-2 text-sm">
                      <div className="bg-neutral-100 px-3 py-1 rounded-full flex items-center">
                        <Wallet className="h-4 w-4 mr-1 text-neutral-600" />
                        <span className="text-neutral-800">
                          {walletAddress ? 
                            `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : 
                            'No wallet'}
                        </span>
                      </div>
                      
                      <div className="bg-neutral-100 px-3 py-1 rounded-full flex items-center">
                        <Coins className="h-4 w-4 mr-1 text-orange-500" />
                        <span className="text-neutral-800">{userData?.points || 0} points</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-neutral-50 rounded-lg p-6 mb-6">
                    <div className="flex flex-col items-center">
                      {checkedInToday ? (
                        <>
                          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                          <h3 className="text-xl font-medium text-neutral-900 mb-2">You&apos;ve checked in today!</h3>
                          <p className="text-neutral-600 text-center">
                            Great job! Come back tomorrow to continue your streak.
                          </p>
                          {pointsEarned > 0 && (
                            <div className="mt-4 bg-green-50 border border-green-100 text-green-800 px-4 py-2 rounded-lg">
                              You earned {pointsEarned} points today!
                            </div>
                          )}
                          <div className="mt-4 bg-white px-4 py-2 rounded-full text-sm flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-neutral-500" />
                            <span>Next check-in available tomorrow</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <CircleAlert className="h-16 w-16 text-orange-500 mb-4" />
                          <h3 className="text-xl font-medium text-neutral-900 mb-2">Ready to check in?</h3>
                          <p className="text-neutral-600 text-center mb-6">
                            Sign with your wallet to confirm your daily check-in and earn points.
                          </p>
                          <button
                            onClick={handleDailyCheckIn}
                            disabled={isCheckingIn || !hasWallet}
                            className="bg-neutral-900 text-white py-3 px-6 rounded-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-800 transition-colors"
                          >
                            {isCheckingIn ? (
                              <>
                                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                                Signing...
                              </>
                            ) : (
                              <>
                                <CalendarCheck className="h-5 w-5 mr-2" />
                                Check In Now
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-neutral-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-neutral-600 mb-1">Current Streak</h4>
                      <div className="text-2xl font-bold text-neutral-900 flex items-center">
                        {userData?.streak || 0} {userData?.streak === 1 ? 'day' : 'days'}
                      </div>
                    </div>
                    
                    <div className="bg-neutral-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-neutral-600 mb-1">Last Check-in</h4>
                      <div className="text-lg font-medium text-neutral-900">
                        {userData?.lastCheckIn 
                          ? new Date(userData.lastCheckIn).toLocaleDateString() 
                          : 'Never'}
                      </div>
                    </div>
                    
                    <div className="bg-neutral-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-neutral-600 mb-1">Total Points</h4>
                      <div className="text-2xl font-bold text-neutral-900 flex items-center">
                        {userData?.points || 0}
                        <Coins className="h-5 w-5 ml-1 text-orange-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <h2 className="text-lg font-medium text-neutral-900 mb-4">About Daily Check-ins</h2>
              <div className="prose prose-neutral">
                <p>
                  Daily check-ins are a simple way to interact with your Civic Auth wallet. 
                  Each day, you can sign a message to confirm your visit and earn points.
                </p>
                <ul>
                  <li>Base points: 10 points per check-in</li>
                  <li>Streak bonus: Your current streak multiplies your base points</li>
                  <li>Check-in once per 24 hours</li>
                </ul>
                <p>
                  These signed messages demonstrate how Civic Auth&apos;s embedded wallets 
                  can be used for simple authentication and verification without requiring 
                  gas fees or complex blockchain transactions.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}