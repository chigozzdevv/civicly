"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUser } from '@civic/auth-web3/react';
import { userHasWallet } from '@civic/auth-web3';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useAccount } from 'wagmi';
import DashboardLayout from '@/components/dashboard-layout';
import DailyCheckin from '@/components/daily-checkin';
import DashboardStats from '@/components/dashboard-stats';
import { Wallet, RefreshCw } from 'lucide-react';

interface UserData {
  points: number;
  streak: number;
  lastCheckIn: string | null;
  leaderboardRank?: number;
}

interface CheckinHistory {
  date: string;
  checked: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const networkParam = searchParams.get('network');
  const selectedNetwork = networkParam === 'ethereum' ? 'ethereum' : 'solana';
  
  const userContext = useUser();
  const { publicKey, signMessage: solanaSignMessage } = useWallet();
  const { connection } = useConnection();
  const { address: ethAddress } = useAccount();
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [isWalletCreating, setIsWalletCreating] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [checkinHistory, setCheckinHistory] = useState<boolean[]>(Array(7).fill(false));
  const [weeklyPointsGrowth, setWeeklyPointsGrowth] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [signError, setSignError] = useState("");
  
  const isAuthenticated = !!userContext.user;
  const hasWallet = userContext && userHasWallet(userContext);

  const handleNetworkChange = (network: 'ethereum' | 'solana') => {
    router.push(`/dashboard?network=${network}`, { scroll: false });
  };

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
    return '';
  };

  const walletAddress = getWalletAddress();

  // Calculate today's points based on the check-in data
  const calculateTodaysPoints = (userData: UserData | null): number => {
    if (!userData || !checkedInToday) return 0;
    
    // Use the same logic from the backend to calculate points
    // This should match the calculateMultiplier function in your check-in API
    const getMultiplier = (streak: number): number => {
      if (streak <= 1) return 1; // Base multiplier
      if (streak <= 3) return 1.25; // 2-3 days streak
      if (streak <= 7) return 1.5; // 4-7 days streak
      if (streak <= 14) return 1.75; // 8-14 days streak
      return 2; // 15+ days streak
    };
    
    const basePoints = 10;
    const multiplier = getMultiplier(userData.streak);
    return Math.floor(basePoints * multiplier);
  };

  // Fetch user data and check-in history
  useEffect(() => {
    const fetchUserData = async () => {
      if (!hasWallet || !walletAddress) return;
      
      setIsLoading(true);
      
      try {
        // Fetch user data
        const userResponse = await fetch(`/api/user-data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress,
            network: selectedNetwork
          }),
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserData(userData.user);
          
          // Check if already checked in today
          if (userData.user.lastCheckIn) {
            const lastCheckIn = new Date(userData.user.lastCheckIn);
            const today = new Date();
            
            if (
              lastCheckIn.getDate() === today.getDate() &&
              lastCheckIn.getMonth() === today.getMonth() &&
              lastCheckIn.getFullYear() === today.getFullYear()
            ) {
              setCheckedInToday(true);
              
              // Calculate points earned based on the streak
              const calculatedPoints = calculateTodaysPoints(userData.user);
              setPointsEarned(calculatedPoints);
            }
          }
          
          // Calculate weekly points growth based on actual data
          if (userData.user.pointsHistory) {
            const currentPoints = userData.user.points;
            const lastWeekPoints = userData.user.pointsHistory.lastWeek || currentPoints;
            
            if (lastWeekPoints > 0) {
              const growth = Math.round(((currentPoints - lastWeekPoints) / lastWeekPoints) * 100);
              setWeeklyPointsGrowth(growth > 0 ? growth : 0);
            }
          } else {
            // Default to 5% if no history
            setWeeklyPointsGrowth(5);
          }
        }
        
        // Fetch check-in history
        const historyResponse = await fetch(`/api/check-in/history?walletAddress=${walletAddress}&network=${selectedNetwork}`);
        
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          
          // Make sure we have history data
          if (historyData.history && Array.isArray(historyData.history)) {
            // Convert the API response to our boolean array format
            const lastSevenDays = historyData.history
              .map((day: CheckinHistory) => day.checked);
            
            // If less than 7 days of history, pad with false values
            const paddedHistory = Array(7).fill(false);
            lastSevenDays.forEach((checked: boolean, index: number) => {
              paddedHistory[paddedHistory.length - lastSevenDays.length + index] = checked;
            });
            
            setCheckinHistory(paddedHistory);
          } else {
            // If no history returned, create simulated history based on streak
            simulateHistory();
          }
        } else {
          // If API fails, create simulated history based on streak
          simulateHistory();
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        simulateHistory();
      } finally {
        setIsLoading(false);
      }
    };
    
    // Helper to simulate history based on streak
    const simulateHistory = () => {
      if (userData?.streak) {
        const simulatedHistory = Array(7).fill(false);
        for (let i = 1; i <= Math.min(userData.streak, 7); i++) {
          simulatedHistory[simulatedHistory.length - i] = true;
        }
        
        if (checkedInToday) {
          simulatedHistory[simulatedHistory.length - 1] = true;
        }
        
        setCheckinHistory(simulatedHistory);
      }
    };
    
    fetchUserData();
  }, [hasWallet, walletAddress, selectedNetwork, userData?.streak, checkedInToday]);

  // Handle daily check in
  const initiateCheckIn = async () => {
    setSignError("");
    setShowSignModal(true);
  };

  const executeCheckIn = async () => {
    if (!hasWallet || !walletAddress) return;
    
    let signature;
    
    setIsCheckingIn(true);
    setShowSignModal(false);
    setSignError("");
    
    try {
      // Create message to sign
      const today = new Date().toISOString();
      const message = `Civicly daily check-in: ${today}`;
      
      // Sign with the appropriate wallet based on network
      if (selectedNetwork === 'ethereum') {
        if ('ethereum' in userContext && userContext.ethereum.wallet) {
          signature = await userContext.ethereum.wallet.signMessage({
            message,
            account: userContext.ethereum.address
          });
        } else {
          throw new Error("No Ethereum wallet available for signing");
        }
      } else { // Solana
        if ('solana' in userContext && userContext.solana.wallet) {
          // Use TextEncoder to convert the message to bytes
          const messageBytes = new TextEncoder().encode(message);
          
          try {
            // Try signing with the Civic Auth wallet
            const signatureBytes = await userContext.solana.wallet.signMessage(messageBytes);
            signature = Buffer.from(signatureBytes).toString('base64');
          } catch (solanaError) {
            console.error("Error signing with Civic Solana wallet:", solanaError);
            
            // Try fallback to adapter if available
            if (solanaSignMessage && publicKey) {
              const signatureBytes = await solanaSignMessage(messageBytes);
              signature = Buffer.from(signatureBytes).toString('base64');
            } else {
              throw new Error("Failed to sign with Solana wallet");
            }
          }
        } else if (solanaSignMessage && publicKey) {
          // Use adapter wallet if Civic wallet not available
          const messageBytes = new TextEncoder().encode(message);
          const signatureBytes = await solanaSignMessage(messageBytes);
          signature = Buffer.from(signatureBytes).toString('base64');
        } else {
          throw new Error("No Solana wallet available for signing");
        }
      }
      
      // Check if we have a signature
      if (!signature) {
        throw new Error("Failed to get signature from wallet");
      }
      
      // Send to backend
      const response = await fetch('/api/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          signature,
          message,
          network: selectedNetwork
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserData(data.user);
        setCheckedInToday(true);
        setPointsEarned(data.pointsEarned);
        
        // Update check-in history
        const updatedHistory = [...checkinHistory];
        updatedHistory[updatedHistory.length - 1] = true;
        setCheckinHistory(updatedHistory);
      } else {
        const errorData = await response.json();
        console.error('Check-in error:', errorData.error);
        setSignError(errorData.error || "Failed to check in");
      }
    } catch (error) {
      console.error("Check-in error:", error);
      setSignError(error instanceof Error ? error.message : "Failed to sign transaction");
    } finally {
      setIsCheckingIn(false);
    }
  };

  if (!isAuthenticated) {
    return null; 
  }

  return (
    <DashboardLayout 
      selectedNetwork={selectedNetwork} 
      onNetworkChange={handleNetworkChange}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-6">Dashboard</h1>
        </motion.div>
        
        {!hasWallet && (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-8">
            <div className="flex flex-col items-center">
              <Wallet className="h-16 w-16 text-orange-500 mb-4" />
              <h3 className="text-xl font-medium text-neutral-900 mb-2">Creating your wallet...</h3>
              <p className="text-neutral-600 text-center mb-4">
                Please wait while we set up your Web3 wallet.
              </p>
              <div className="flex items-center justify-center">
                <RefreshCw className="h-5 w-5 mr-2 animate-spin text-orange-500" />
                <span className="text-neutral-600">This should only take a moment</span>
              </div>
            </div>
          </div>
        )}
        
        {hasWallet && userData && !isLoading && (
          <>
            <DashboardStats 
              totalPoints={userData.points || 0}
              leaderboardRank={userData.leaderboardRank || 99}
              pointsToday={pointsEarned}
              pointsTrend={weeklyPointsGrowth}
              network={selectedNetwork}
            />
            
            <DailyCheckin
              userData={userData}
              walletAddress={walletAddress}
              checkedInToday={checkedInToday}
              pointsEarned={pointsEarned}
              isCheckingIn={isCheckingIn}
              onCheckIn={initiateCheckIn}
              network={selectedNetwork}
              checkinHistory={checkinHistory}
              signError={signError}
            />
          </>
        )}
        
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        )}
      </div>
      
      {/* Wallet Signing Modal - Improved Design */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
              <h3 className="text-lg font-medium text-white">Sign with your Wallet</h3>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                  <Wallet className="h-8 w-8 text-orange-500" />
                </div>
                <h4 className="text-lg font-medium text-neutral-900 mb-2">Confirm Daily Check-in</h4>
                <p className="text-neutral-600 mb-6">
                  Your {selectedNetwork === 'ethereum' ? 'Ethereum' : 'Solana'} wallet will open to sign a message confirming your check-in.
                </p>
                
                <div className="bg-neutral-50 p-4 rounded-md mb-6 w-full text-left">
                  <p className="text-sm text-neutral-700 mb-1">Wallet Address</p>
                  <p className="font-mono text-sm text-neutral-900">
                    {walletAddress && walletAddress.length > 10
                      ? `${walletAddress.slice(0, 10)}...${walletAddress.slice(-6)}`
                      : walletAddress}
                  </p>
                </div>
                
                {signError && (
                  <div className="bg-red-50 border border-red-100 rounded-md p-3 mb-4 w-full text-red-600 text-sm">
                    {signError}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3 w-full">
                  <button
                    onClick={() => setShowSignModal(false)}
                    className="px-4 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeCheckIn}
                    className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}