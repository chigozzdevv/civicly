"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  User, Award, Trophy, Coins, CalendarCheck
} from 'lucide-react';
import { useUser } from '@civic/auth-web3/react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useAccount } from 'wagmi';
import DashboardLayout from '@/components/dashboard-layout';

interface LeaderboardEntry {
  id: string;
  walletAddress: string;
  walletShort: string;
  network: string;
  points: number;
  streak: number;
  rank: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const networkParam = searchParams.get('network');
  const selectedNetwork = networkParam === 'ethereum' ? 'ethereum' : 'solana';
  
  const userContext = useUser();
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { address: ethAddress } = useAccount();
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const isAuthenticated = !!userContext.user;

  const handleNetworkChange = (network: 'ethereum' | 'solana') => {
    router.push(`/leaderboard?network=${network}`, { scroll: false });
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

  // Load leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/leaderboard?network=${selectedNetwork}`);
        if (response.ok) {
          const data = await response.json();
          setLeaderboard(data.leaderboard);
          
          // Find user's rank
          if (walletAddress) {
            const userEntry = data.leaderboard.find(
              (entry: LeaderboardEntry) => entry.walletAddress === walletAddress
            );
            if (userEntry) {
              setUserRank(userEntry.rank);
            } else {
              setUserRank(null);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, [walletAddress, selectedNetwork]);

  if (!isAuthenticated) {
    return null; // Will redirect in the useEffect
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
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-6">Leaderboard</h1>
          
          {userRank && (
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-8">
              <div className="flex items-center">
                <div className="bg-orange-100 rounded-full p-3 mr-4">
                  <Trophy className="h-8 w-8 text-orange-500" />
                </div>
                
                <div>
                  <h2 className="text-lg font-medium text-neutral-900">Your Ranking</h2>
                  <p className="text-neutral-600">
                    You&apos;re currently ranked <span className="font-bold text-neutral-900">#{userRank}</span> on the {selectedNetwork} network leaderboard
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
            <div className="p-6 border-b border-neutral-100">
              <h2 className="text-lg font-medium text-neutral-900">Top Performers</h2>
              <p className="text-neutral-600">Users with the most points earned on the {selectedNetwork} network</p>
            </div>
            
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                <p className="mt-4 text-neutral-600">Loading leaderboard...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-neutral-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Points</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Streak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {leaderboard.length > 0 ? (
                      leaderboard.map((entry) => (
                        <tr 
                          key={entry.id}
                          className={
                            walletAddress && entry.walletAddress === walletAddress
                              ? 'bg-orange-50'
                              : 'hover:bg-neutral-50'
                          }
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            {entry.rank <= 3 ? (
                              <div className="flex items-center">
                                <Award className={`h-5 w-5 mr-1 ${
                                  entry.rank === 1 ? 'text-yellow-500' :
                                  entry.rank === 2 ? 'text-neutral-400' :
                                  'text-amber-700'
                                }`} />
                                <span className="font-medium">{entry.rank}</span>
                              </div>
                            ) : (
                              <span>{entry.rank}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="bg-neutral-100 rounded-full h-8 w-8 flex items-center justify-center mr-3">
                                <User className="h-4 w-4 text-neutral-500" />
                              </div>
                              <span className="font-medium text-neutral-900">{entry.walletShort}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Coins className="h-4 w-4 mr-1 text-orange-500" />
                              <span>{entry.points}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <CalendarCheck className="h-4 w-4 mr-1 text-neutral-600" />
                              <span>{entry.streak} days</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-neutral-500">
                          No data available on the leaderboard yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}