"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  CalendarCheck, MessageSquare, Coins, Trophy, LogOut, 
  User, Award
} from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@civic/auth-web3/react';
import { useWallet } from '@solana/wallet-adapter-react';

interface LeaderboardEntry {
  id: string;
  walletAddress: string;
  walletShort: string;
  points: number;
  streak: number;
  rank: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const userContext = useUser();
  const { publicKey } = useWallet();
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  
  const isAuthenticated = !!userContext.user;
  
  // Protect route
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Load leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/leaderboard');
        if (response.ok) {
          const data = await response.json();
          setLeaderboard(data.leaderboard);
          
          // Find user's rank
          if (publicKey) {
            const userEntry = data.leaderboard.find(
              (entry: LeaderboardEntry) => entry.walletAddress === publicKey.toString()
            );
            if (userEntry) {
              setUserRank(userEntry.rank);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      }
    };
    
    fetchLeaderboard();
  }, [publicKey]);

  const handleLogout = async () => {
    if (userContext.signOut) {
      await userContext.signOut();
    }
    router.push('/');
  };

  if (!isAuthenticated) {
    return null; // Will redirect in the useEffect
  }

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
            <Link href="/dashboard" className="flex items-center px-2 py-2 text-neutral-600 hover:bg-neutral-100 rounded-md">
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
            <Link href="/leaderboard" className="flex items-center px-2 py-2 text-neutral-900 rounded-md bg-neutral-100">
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
          <Link href="/dashboard" className="p-2 text-neutral-600 flex flex-col items-center">
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
          <Link href="/leaderboard" className="p-2 text-neutral-900 flex flex-col items-center">
            <Trophy className="h-6 w-6" />
            <span className="text-xs mt-1">Leaders</span>
          </Link>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 md:ml-64 pt-16 md:pt-0">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-6">Leaderboard</h1>
            
            {userRank && (
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-8">
                <div className="flex items-center">
                  <div className="bg-orange-100 rounded-full p-3 mr-4">
                    <Trophy className="h-8 w-8 text-orange-500" />
                  </div>
                  
                  <div>
                    <h2 className="text-lg font-medium text-neutral-900">Your Ranking</h2>
                    <p className="text-neutral-600">
                      You&apos;re currently ranked <span className="font-bold text-neutral-900">#{userRank}</span> on the leaderboard
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
              <div className="p-6 border-b border-neutral-100">
                <h2 className="text-lg font-medium text-neutral-900">Top Performers</h2>
                <p className="text-neutral-600">Users with the most points earned</p>
              </div>
              
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
                    {leaderboard.map((entry) => (
                      <tr 
                        key={entry.id}
                        className={
                          publicKey && entry.walletAddress === publicKey.toString()
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
