import React from 'react';
import { motion } from 'framer-motion';
import { Coins, Users, ArrowUp, TrendingUp } from 'lucide-react';

interface DashboardStatsProps {
  totalPoints: number;
  leaderboardRank: number;
  pointsToday: number;
  pointsTrend: number;
}

export default function DashboardStats({ 
  totalPoints, 
  leaderboardRank, 
  pointsToday, 
  pointsTrend 
}: DashboardStatsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
    >
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <h3 className="text-neutral-500 text-sm font-medium mb-1">Total Points</h3>
        <div className="flex items-end justify-between">
          <div className="text-3xl font-bold">{totalPoints}</div>
          <div className="flex items-center text-green-600 text-sm">
            <ArrowUp className="w-4 h-4 mr-1" />
            <span>{pointsTrend}%</span>
          </div>
        </div>
        <div className="mt-4 h-1 bg-neutral-100 rounded overflow-hidden">
          <div 
            className="h-full bg-blue-500 rounded" 
            style={{ width: `${Math.min(totalPoints / 10, 100)}%` }} 
          />
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <h3 className="text-neutral-500 text-sm font-medium mb-1">Leaderboard Rank</h3>
        <div className="flex items-end justify-between">
          <div className="text-3xl font-bold">#{leaderboardRank}</div>
          <div className="flex items-center text-neutral-600 text-sm">
            <Users className="w-4 h-4 mr-1" />
            <span>of 250</span>
          </div>
        </div>
        <div className="mt-4 h-1 bg-neutral-100 rounded overflow-hidden">
          <div 
            className="h-full bg-purple-500 rounded" 
            style={{ width: `${100 - Math.min((leaderboardRank / 250) * 100, 100)}%` }} 
          />
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <h3 className="text-neutral-500 text-sm font-medium mb-1">Points Today</h3>
        <div className="flex items-end justify-between">
          <div className="text-3xl font-bold">{pointsToday}</div>
          <div className="flex items-center text-orange-500">
            <Coins className="w-5 h-5" />
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <h3 className="text-neutral-500 text-sm font-medium mb-1">Weekly Trend</h3>
        <div className="flex items-end justify-between">
          <div className="text-3xl font-bold">+{pointsTrend}%</div>
          <div className="flex items-center text-green-500">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}