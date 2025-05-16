import React from 'react';
import { motion } from 'framer-motion';
import { Coins, Users, ArrowUp, TrendingUp, Star, Award, Badge } from 'lucide-react';

interface DashboardStatsProps {
  totalPoints: number;
  leaderboardRank: number;
  pointsToday: number;
  pointsTrend: number;
  network: 'ethereum' | 'solana';
}

export default function DashboardStats({
  totalPoints,
  leaderboardRank,
  pointsToday,
  pointsTrend,
  network
}: DashboardStatsProps) {
  const tiers = [
    { name: "Bronze", min: 0, max: 999, color: "from-amber-700 to-amber-600" },
    { name: "Silver", min: 1000, max: 4999, color: "from-slate-400 to-slate-300" },
    { name: "Gold", min: 5000, max: 9999, color: "from-yellow-500 to-amber-400" },
    { name: "Platinum", min: 10000, max: 24999, color: "from-cyan-400 to-sky-300" },
    { name: "Diamond", min: 25000, max: Infinity, color: "from-blue-400 to-indigo-300" }
  ];
  
  const currentTier = tiers.find(tier => totalPoints >= tier.min && totalPoints <= tier.max) || tiers[0];
  const nextTier = tiers.find(tier => tier.min > totalPoints) || tiers[tiers.length - 1];
  const pointsToNextTier = nextTier.min - totalPoints;
  const progressPercent = currentTier.name === nextTier.name 
    ? 100 
    : Math.round(((totalPoints - currentTier.min) / (nextTier.min - currentTier.min)) * 100);
  
  const networkColor = network === 'ethereum' ? 'blue' : 'purple';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="mb-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Total Points Card */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="flex flex-col h-full">
            <div className="px-6 pt-5 pb-4 flex justify-between items-start">
              <div>
                <h3 className="text-neutral-500 text-sm font-medium mb-1 flex items-center">
                  Total Points
                  <Badge className="w-3.5 h-3.5 ml-1 text-orange-500" />
                </h3>
                <div className="flex items-center">
                  <div className="text-3xl font-bold text-neutral-900">{totalPoints.toLocaleString()}</div>
                  {pointsTrend > 0 && (
                    <div className="flex items-center text-green-600 text-sm ml-2">
                      <ArrowUp className="w-4 h-4 mr-0.5" />
                      <span>{pointsTrend}%</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center">
                <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${currentTier.color} text-white text-xs font-medium`}>
                  {currentTier.name} Tier
                </div>
              </div>
            </div>
            
            <div className="px-6 pb-5 pt-2 flex-grow">
              <div className="mt-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-neutral-500">
                <span>{currentTier.name}</span>
                {currentTier !== nextTier && (
                  <>
                    <span>{pointsToNextTier.toLocaleString()} points to {nextTier.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Leaderboard Rank Card */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="px-6 pt-5 pb-5">
            <h3 className="text-neutral-500 text-sm font-medium mb-1 flex items-center">
              Leaderboard Rank
              <Award className="w-3.5 h-3.5 ml-1 text-blue-500" />
            </h3>
            <div className="flex items-start justify-between">
              <div className="text-3xl font-bold text-neutral-900">#{leaderboardRank}</div>
              <div className="mt-1.5 flex items-center text-neutral-600 text-xs px-2 py-1 bg-neutral-100 rounded-full">
                <Users className="w-3 h-3 mr-1" />
                <span>{leaderboardRank > 100 ? '100+' : 'Top 100'}</span>
              </div>
            </div>
            
            <div className="mt-3 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-${networkColor}-500 rounded-full`}
                style={{ width: `${Math.max(100 - (leaderboardRank > 100 ? 100 : leaderboardRank), 5)}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-neutral-500">
              {leaderboardRank <= 10 ? (
                <span className="text-green-600 font-medium">You're in the top 10! 🏆</span>
              ) : (
                <span>{leaderboardRank - 10} ranks away from top 10</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Points Today Card */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="px-6 pt-5 pb-5">
            <div className="flex justify-between items-start">
              <h3 className="text-neutral-500 text-sm font-medium mb-1 flex items-center">
                Today's Earnings
                <Coins className="w-3.5 h-3.5 ml-1 text-orange-500" />
              </h3>
            </div>
            
            <div className="flex justify-between items-center">
              <div className={`text-3xl font-bold ${pointsToday > 0 ? 'text-green-600' : 'text-neutral-900'}`}>
                {pointsToday > 0 ? `+${pointsToday}` : '0'}
              </div>
              
              <div className="flex items-center text-neutral-600">
                <Coins className="w-5 h-5 text-orange-500" />
              </div>
            </div>
            
            <div className="mt-3 text-sm text-neutral-600">
              {pointsToday > 0 ? (
                <span className="text-green-600">Great job checking in today!</span>
              ) : (
                <span>Check in today to earn points</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}