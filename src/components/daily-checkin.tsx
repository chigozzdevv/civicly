import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, Wallet, CalendarCheck, CheckCircle, CircleAlert, Clock, RefreshCw, HelpCircle, Award, Info, X } from 'lucide-react';

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
  checkinHistory: boolean[];
  signError?: string;
}

export default function DailyCheckin({ 
  userData, 
  walletAddress, 
  checkedInToday, 
  pointsEarned, 
  isCheckingIn, 
  onCheckIn,
  network,
  checkinHistory,
  signError = ""
}: DailyCheckinProps) {
  const [showInfo, setShowInfo] = useState(false);

  // Calculate streak multiplier
  const getStreakMultiplier = (streak: number) => {
    if (streak <= 1) return 1;
    if (streak <= 3) return 1.25;
    if (streak <= 7) return 1.5;
    if (streak <= 14) return 1.75;
    return 2;
  };

  // Get day names for the calendar
  const getDayNames = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
        date: date.getDate()
      });
    }
    return days;
  };

  const dayNames = getDayNames();
  const networkColor = network === 'ethereum' ? 'blue' : 'purple';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-neutral-900">Daily Check-in</h2>
        <button 
          onClick={() => setShowInfo(!showInfo)}
          className="text-neutral-600 hover:text-neutral-900 bg-neutral-100 p-1.5 rounded-full"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
      </div>
      
      <div className={`bg-white rounded-xl shadow-sm border-2 ${
        checkedInToday ? 'border-green-400' : 'border-neutral-200'
      } overflow-hidden`}>
        {/* Header Card with Gradient */}
        <div className={`bg-gradient-to-r ${
          checkedInToday ? 'from-green-500 to-green-400' : 'from-orange-500 to-orange-400'
        } py-4 px-6 text-white`}>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium flex items-center">
              {checkedInToday ? 'You\'ve checked in today!' : 'Ready to check in?'}
              {userData?.streak && userData.streak >= 7 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white bg-opacity-20 backdrop-blur-sm">
                  <Award className="w-3 h-3 mr-1" />
                  {userData.streak} Day Streak!
                </span>
              )}
            </h3>
            
            <div className="flex items-center space-x-2 text-sm">
              <div className="bg-black bg-opacity-20 px-3 py-1 rounded-full flex items-center text-white">
                <Wallet className="h-4 w-4 mr-1 text-white" />
                <span>{walletAddress ? 
                  `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : 
                  'No wallet'}
                </span>
              </div>
            </div>
          </div>
          <p className="text-white text-opacity-90 mt-1">
            {checkedInToday 
              ? 'Great job! Come back tomorrow to continue your streak.' 
              : 'Sign with your wallet to confirm your daily check-in and earn points.'}
          </p>
        </div>
        
        <div className="p-6">
          {/* Check-in calendar - modernized visual design */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-neutral-600 mb-3">Last 7 Days</h4>
            <div className="bg-neutral-50 p-4 rounded-lg">
              <div className="flex justify-between">
                {checkinHistory.map((checked, index) => {
                  return (
                    <div key={index} className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        checked 
                          ? 'bg-gradient-to-b from-orange-500 to-orange-400 text-white shadow-sm' 
                          : index === checkinHistory.length - 1 && !checked
                            ? 'bg-white border-2 border-dashed border-orange-300 text-neutral-600'
                            : 'bg-white border border-neutral-200 text-neutral-400'
                      }`}>
                        {dayNames[index].date}
                      </div>
                      <span className={`text-xs mt-1.5 ${
                        index === checkinHistory.length - 1 
                          ? 'font-medium text-orange-700' 
                          : 'text-neutral-500'
                      }`}>
                        {dayNames[index].dayName}
                      </span>
                      {checked && (
                        <div className="mt-1">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Streak Stats - Redesigned */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-b from-neutral-50 to-neutral-100 p-4 rounded-lg border border-neutral-200">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-neutral-600">Current Streak</h4>
                <CalendarCheck className="h-4 w-4 text-orange-500" />
              </div>
              <div className="mt-1.5 text-2xl font-bold text-neutral-900 flex items-center">
                {userData?.streak || 0} {userData?.streak === 1 ? 'day' : 'days'}
              </div>
            </div>
            
            <div className="bg-gradient-to-b from-neutral-50 to-neutral-100 p-4 rounded-lg border border-neutral-200">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-neutral-600">Streak Multiplier</h4>
                <Coins className="h-4 w-4 text-orange-500" />
              </div>
              <div className="mt-1.5 text-2xl font-bold text-orange-500 flex items-center">
                {userData?.streak ? getStreakMultiplier(userData.streak) : 1}x
              </div>
            </div>
            
            <div className="bg-gradient-to-b from-neutral-50 to-neutral-100 p-4 rounded-lg border border-neutral-200">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-neutral-600">Today's Reward</h4>
                <Award className="h-4 w-4 text-orange-500" />
              </div>
              <div className="mt-1.5 text-2xl font-bold flex items-center">
                {checkedInToday 
                  ? <span className="text-green-600">+{pointsEarned}</span> 
                  : <span className="text-orange-600">
                      {userData?.streak !== undefined 
                        ? Math.round(10 * getStreakMultiplier(userData.streak))
                        : 10}
                    </span>
                }
                <Coins className="h-5 w-5 ml-1 text-orange-500" />
              </div>
            </div>
          </div>
          
          {/* Check-in action area */}
          <div className={`rounded-lg p-6 ${
            checkedInToday 
              ? 'bg-green-50 border border-green-100' 
              : 'bg-neutral-50 border border-neutral-200'
          }`}>
            <div className="flex flex-col items-center">
              {checkedInToday ? (
                <>
                  <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                  
                  {pointsEarned > 0 && (
                    <div className="mb-4 bg-white border border-green-200 text-green-800 px-5 py-2 rounded-lg flex items-center shadow-sm">
                      <Coins className="h-5 w-5 mr-2 text-green-600" />
                      You earned {pointsEarned} points today!
                    </div>
                  )}
                  
                  <div className="bg-white px-4 py-2 rounded-full text-sm flex items-center border border-neutral-200 shadow-sm">
                    <Clock className="h-4 w-4 mr-2 text-neutral-500" />
                    <span>Next check-in available tomorrow</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-6 w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center">
                    <CalendarCheck className="h-10 w-10 text-orange-500" />
                  </div>
                  
                  {signError && (
                    <div className="mb-4 w-full bg-red-50 border border-red-100 rounded-lg p-3 text-red-600 text-sm">
                      {signError}
                    </div>
                  )}
                  
                  <button
                    onClick={onCheckIn}
                    disabled={isCheckingIn}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-6 rounded-lg flex items-center disabled:opacity-70 disabled:cursor-not-allowed hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm"
                  >
                    {isCheckingIn ? (
                      <>
                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                        Signing with {network === 'ethereum' ? 'Ethereum' : 'Solana'}...
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
        </div>
      </div>
      
      {/* Info Panel */}
      {showInfo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-md border border-neutral-200 p-6 mt-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-neutral-900 flex items-center">
              <Info className="w-5 h-5 mr-2 text-orange-500" />
              About Daily Check-ins
            </h3>
            <button 
              onClick={() => setShowInfo(false)}
              className="text-neutral-400 hover:text-neutral-900 bg-neutral-100 p-1.5 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                <Coins className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-medium mb-1">10 Base Points</h4>
              <p className="text-sm text-neutral-600">Per daily check-in</p>
            </div>
            
            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <CalendarCheck className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-medium mb-2">Streak Multiplier</h4>
              <div className="text-sm text-neutral-600 grid grid-cols-2 gap-x-4 gap-y-1">
                <div>2-3 days:</div><div className="font-medium">1.25x</div>
                <div>4-7 days:</div><div className="font-medium">1.5x</div>
                <div>8-14 days:</div><div className="font-medium">1.75x</div>
                <div>15+ days:</div><div className="font-medium">2x</div>
              </div>
            </div>
            
            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-medium mb-1">Once per Day</h4>
              <p className="text-sm text-neutral-600">Check-in resets at midnight UTC</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}