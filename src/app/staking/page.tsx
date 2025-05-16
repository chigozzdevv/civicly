"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Lock, Unlock, RefreshCw, Clock, ArrowDownUp, Coins
} from 'lucide-react';
import { useUser } from '@civic/auth-web3/react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useAccount } from 'wagmi';
import DashboardLayout from '@/components/dashboard-layout';

interface StakingInfo {
  id: string;
  amount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface UserData {
  points: number;
}

export default function StakingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const networkParam = searchParams.get('network');
  const selectedNetwork = networkParam === 'ethereum' ? 'ethereum' : 'solana';
  
  const userContext = useUser();
  const { publicKey, signMessage: solanaSignMessage } = useWallet();
  const { connection } = useConnection();
  const { address: ethAddress } = useAccount();
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [stakingInfo, setStakingInfo] = useState<StakingInfo | null>(null);
  const [stakingAmount, setStakingAmount] = useState('');
  const [stakingDuration, setStakingDuration] = useState('7');
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [signError, setSignError] = useState('');

  const isAuthenticated = !!userContext.user;

  const handleNetworkChange = (network: 'ethereum' | 'solana') => {
    router.push(`/staking?network=${network}`, { scroll: false });
  };

  // Protect route
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

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

  // Load user data and staking info
  useEffect(() => {
    const fetchData = async () => {
      if (!walletAddress) return;
      
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
        }

        // Fetch staking data
        const stakingResponse = await fetch(`/api/stake?walletAddress=${walletAddress}&network=${selectedNetwork}`);
        if (stakingResponse.ok) {
          const stakingData = await stakingResponse.json();
          if (stakingData.stakes && stakingData.stakes.length > 0) {
            setStakingInfo(stakingData.stakes[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, [walletAddress, selectedNetwork]);

  // Calculate time left in staking
  useEffect(() => {
    if (!stakingInfo) return;

    const updateTimeLeft = () => {
      const endDate = new Date(stakingInfo.endDate);
      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      
      if (diffTime <= 0) {
        setTimeLeft('Stake period completed');
        return;
      }
      
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft(`${diffDays}d ${diffHours}h ${diffMinutes}m`);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000);
    
    return () => clearInterval(interval);
  }, [stakingInfo]);

  const handleStake = async () => {
    if (!walletAddress || isStaking || !stakingAmount || parseInt(stakingAmount) <= 0) return;
    
    const amount = parseInt(stakingAmount);
    if (amount > (userData?.points || 0)) return;
    
    setIsStaking(true);
    setSignError('');
    
    try {
      let signature;
      
      // Create message to sign
      const timestamp = new Date().toISOString();
      const duration = parseInt(stakingDuration);
      const messageToSign = `Civicly stake: ${amount} points for ${duration} days at ${timestamp}`;
      
      // Sign with the appropriate wallet based on network
      if (selectedNetwork === 'ethereum') {
        if ('ethereum' in userContext && userContext.ethereum.wallet) {
          signature = await userContext.ethereum.wallet.signMessage({
            message: messageToSign,
            account: userContext.ethereum.address
          });
        } else {
          throw new Error("No Ethereum wallet available for signing");
        }
      } else { // Solana
        if ('solana' in userContext && userContext.solana.wallet) {
          // Use TextEncoder to convert the message to bytes
          const messageBytes = new TextEncoder().encode(messageToSign);
          
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
          const messageBytes = new TextEncoder().encode(messageToSign);
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
      const response = await fetch('/api/stake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          amount,
          duration,
          signature,
          network: selectedNetwork
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserData(data.user);
        setStakingInfo(data.stake);
        setStakingAmount('');
      } else {
        const errorData = await response.json();
        setSignError(errorData.error || "Failed to stake points");
      }
    } catch (error) {
      console.error("Staking error:", error);
      setSignError(error instanceof Error ? error.message : "Failed to sign stake transaction");
    } finally {
      setIsStaking(false);
    }
  };

  const handleUnstake = async () => {
    if (!walletAddress || isUnstaking || !stakingInfo) return;
    
    setIsUnstaking(true);
    setSignError('');
    
    try {
      let signature;
      
      // Create message to sign
      const timestamp = new Date().toISOString();
      const messageToSign = `Civicly unstake: ${stakingInfo.id} at ${timestamp}`;
      
      // Sign with the appropriate wallet based on network
      if (selectedNetwork === 'ethereum') {
        if ('ethereum' in userContext && userContext.ethereum.wallet) {
          signature = await userContext.ethereum.wallet.signMessage({
            message: messageToSign,
            account: userContext.ethereum.address
          });
        } else {
          throw new Error("No Ethereum wallet available for signing");
        }
      } else { // Solana
        if ('solana' in userContext && userContext.solana.wallet) {
          // Use TextEncoder to convert the message to bytes
          const messageBytes = new TextEncoder().encode(messageToSign);
          
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
          const messageBytes = new TextEncoder().encode(messageToSign);
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
      const response = await fetch('/api/stake', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          stakeId: stakingInfo.id,
          signature,
          network: selectedNetwork
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserData(data.user);
        setStakingInfo(null);
        
        // If there was a reward, show a notification
        if (data.reward > 0) {
          alert(`Congratulations! You earned ${data.reward} bonus points from staking!`);
        }
      } else {
        const errorData = await response.json();
        setSignError(errorData.error || "Failed to unstake points");
      }
    } catch (error) {
      console.error("Unstaking error:", error);
      setSignError(error instanceof Error ? error.message : "Failed to sign unstake transaction");
    } finally {
      setIsUnstaking(false);
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
      <div className="max-w-4xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-6">Staking</h1>
          
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden mb-8">
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-medium text-neutral-900">Earn Bonus Points</h2>
                  <p className="text-neutral-600">Stake your points to earn interest over time</p>
                </div>
                
                <div className="mt-4 md:mt-0 bg-neutral-100 px-4 py-2 rounded-full flex items-center">
                  <Coins className="h-5 w-5 mr-2 text-orange-500" />
                  <span className="text-neutral-800 font-medium">{userData?.points || 0} available points</span>
                </div>
              </div>
              
              {stakingInfo ? (
                <div className="bg-neutral-50 rounded-lg p-6">
                  <div className="flex flex-col items-center">
                    <Lock className="h-16 w-16 text-orange-500 mb-4" />
                    <h3 className="text-xl font-medium text-neutral-900 mb-2">Points Currently Staked</h3>
                    
                    <div className="bg-white px-6 py-3 rounded-lg text-2xl font-bold text-neutral-900 mb-4">
                      {stakingInfo.amount} points
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-6">
                      <div className="bg-white p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-neutral-600 mb-1">Staking Duration</h4>
                        <div className="font-medium text-neutral-900">
                          {Math.ceil((new Date(stakingInfo.endDate).getTime() - new Date(stakingInfo.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-neutral-600 mb-1">Start Date</h4>
                        <div className="font-medium text-neutral-900">
                          {new Date(stakingInfo.startDate).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-neutral-600 mb-1">Time Remaining</h4>
                        <div className="font-medium text-neutral-900 flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-neutral-500" />
                          {timeLeft}
                        </div>
                      </div>
                    </div>
                    
                    {signError && (
                      <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm mb-4 w-full">
                        {signError}
                      </div>
                    )}
                    
                    <button
                      onClick={handleUnstake}
                      disabled={isUnstaking || !walletAddress}
                      className="bg-orange-500 text-white py-3 px-6 rounded-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors"
                    >
                      {isUnstaking ? (
                        <>
                          <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Unlock className="h-5 w-5 mr-2" />
                          Unstake Points
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-neutral-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-neutral-900 mb-4">Start Staking</h3>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <label htmlFor="staking-amount" className="block text-sm font-medium text-neutral-700 mb-1">
                        Amount to Stake
                      </label>
                      <div className="relative">
                        <input
                          id="staking-amount"
                          type="number"
                          value={stakingAmount}
                          onChange={(e) => setStakingAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="w-full px-4 py-3 rounded-md border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          min="1"
                          max={userData?.points || 0}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <Coins className="h-5 w-5 text-neutral-400" />
                        </div>
                      </div>
                      {parseInt(stakingAmount) > (userData?.points || 0) && (
                        <p className="mt-1 text-sm text-red-600">
                          Not enough points available
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="staking-duration" className="block text-sm font-medium text-neutral-700 mb-1">
                        Staking Duration
                      </label>
                      <select
                        id="staking-duration"
                        value={stakingDuration}
                        onChange={(e) => setStakingDuration(e.target.value)}
                        className="w-full px-4 py-3 rounded-md border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="7">7 days (5% interest)</option>
                        <option value="30">30 days (12% interest)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 border border-orange-100 rounded-md p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <ArrowDownUp className="h-5 w-5 text-orange-500" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-neutral-900">Interest Rate</h4>
                        <p className="mt-1 text-sm text-neutral-700">
                          You'll earn{' '}
                          <span className="font-medium">
                            {stakingDuration === '7' ? '5%' : '12%'}
                          </span>{' '}
                          interest after the staking period.
                          Early unstaking will forfeit any interest.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {signError && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm mb-4">
                      {signError}
                    </div>
                  )}
                  
                  <button
                    onClick={handleStake}
                    disabled={
                      isStaking || 
                      !stakingAmount || 
                      parseInt(stakingAmount) <= 0 || 
                      parseInt(stakingAmount) > (userData?.points || 0) || 
                      !walletAddress
                    }
                    className="w-full bg-orange-500 text-white py-3 px-6 rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors"
                  >
                    {isStaking ? (
                      <>
                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lock className="h-5 w-5 mr-2" />
                        Stake Points
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <h2 className="text-lg font-medium text-neutral-900 mb-4">About Staking</h2>
            <div className="prose prose-neutral">
              <p>
                Staking lets you earn bonus points by locking up your existing points 
                for a period of time. This demonstrates another way to use Civic Auth's 
                embedded wallets for more complex interactions.
              </p>
              <ul>
                <li>7-day staking: Earn 5% interest</li>
                <li>30-day staking: Earn 12% interest</li>
                <li>Early unstaking is allowed, but forfeits any interest</li>
              </ul>
              <p>
                Like daily check-ins, staking uses wallet signatures to verify your 
                actions without requiring gas fees or complex on-chain transactions.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}