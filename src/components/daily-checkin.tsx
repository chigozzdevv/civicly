import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, Wallet, CalendarCheck, CheckCircle, CircleAlert, Clock, RefreshCw, HelpCircle } from 'lucide-react';

interface UserData {
  points: number;
  streak: number;
  lastCheckIn: string | null;
}

interface DailyCheckinProps {
  userData: UserData | null;
  walletAddress: string;
  checkedInToday: boolean;
  pointsEarned: number;
  isCheckingIn: boolean;
  onCheckIn: () => Promise<void>;
  network: 'ethereum' | 'solana';
}

export default function DailyCheckin({ 
  userData, 
  walletAddress, 
  checkedInToday, 
  pointsEarned, 
  isCheckingIn, 
  onCheckIn,
  network
}: DailyCheckinProps) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-neutral-900">Daily Check-in</h2>
        <button 
          onClick={() => setShowInfo(!showInfo)}
          className="text-neutral-600 hover:text-neutral-900"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
      </div>
      
      <div className={`bg-white rounded-xl shadow-sm border-2 ${checkedInToday ? 'border-green-400' : 'border-neutral-200'} overflow-hidden`}>
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-neutral-900">Welcome back!</h3>
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
          
          <div className={`rounded-lg p-6 mb-6 ${checkedInToday ? 'bg-green-50 border border-green-100' : 'bg-neutral-50'}`}>
            <div className="flex flex-col items-center">
              {checkedInToday ? (
                <>
                  <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                  <h3 className="text-xl font-medium text-neutral-900 mb-2">You&apos;ve checked in today!</h3>
                  <p className="text-neutral-600 text-center">
                    Great job! Come back tomorrow to continue your streak.
                  </p>
                  {pointsEarned > 0 && (
                    <div className="mt-4 bg-green-100 border border-green-200 text-green-800 px-4 py-2 rounded-lg">
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
                    Sign with your {network === 'ethereum' ? 'Ethereum' : 'Solana'} wallet to confirm your daily check-in and earn points.
                  </p>
                  <button
                    onClick={onCheckIn}
                    disabled={isCheckingIn}
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
      
      {showInfo && (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-neutral-900">About Daily Check-ins</h3>
            <button 
              onClick={() => setShowInfo(false)}
              className="text-neutral-500 hover:text-neutral-900"
            >
              ✕
            </button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-3 bg-neutral-50 rounded-lg flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                <Coins className="h-5 w-5 text-blue-600" />
              </div>
              <h4 className="font-medium mb-1">10 Base Points</h4>
              <p className="text-sm text-neutral-600">Per daily check-in</p>
            </div>
            
            <div className="p-3 bg-neutral-50 rounded-lg flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
                <CalendarCheck className="h-5 w-5 text-green-600" />
              </div>
              <h4 className="font-medium mb-1">Streak Multiplier</h4>
              <p className="text-sm text-neutral-600">Earn more with consistency</p>
            </div>
            
            <div className="p-3 bg-neutral-50 rounded-lg flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <h4 className="font-medium mb-1">Once per Day</h4>
              <p className="text-sm text-neutral-600">Check-in every 24 hours</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}