// app/api/check-in/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { User } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, signature, message, network = 'solana' } = await req.json();
    
    if (!walletAddress || !signature || !message) {
      return NextResponse.json(
        { error: 'Wallet address, signature, and message are required' },
        { status: 400 }
      );
    }

    let user = await prisma.user.findFirst({
      where: {
        walletAddress,
        network
      },
    });

    if (!user) {
      const newUser = await prisma.user.create({
        data: {
          walletAddress,
          network,
          points: 0,
          streak: 0,
        },
      });
      
      return handleCheckin(newUser, signature, message, network);
    }

    return handleCheckin(user, signature, message, network);
  } catch (error) {
    console.error('Error in check-in API:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

type UserWithRank = User & { leaderboardRank: number };

async function handleCheckin(
  user: User, 
  signature: string, 
  message: string, 
  network: string
): Promise<NextResponse<{ user: UserWithRank, pointsEarned: number }>> {
  // Check if already checked in today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Find today's check-in
  const todayCheckIn = await prisma.checkIn.findFirst({
    where: {
      userId: user.id,
      createdAt: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) // Next day
      }
    }
  });
  
  if (todayCheckIn) {
    return NextResponse.json(
      { error: 'Already checked in today' },
      { status: 400 }
    ) as any;
  }

  // Calculate streak
  let newStreak = 1;
  
  // Get the most recent check-in
  const latestCheckIn = await prisma.checkIn.findFirst({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  if (latestCheckIn) {
    const lastCheckInDate = new Date(latestCheckIn.createdAt);
    lastCheckInDate.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    if (lastCheckInDate.getTime() === yesterday.getTime()) {
      newStreak = user.streak + 1;
    }
  }

  // Calculate points (base 10 * streak multiplier)
  const multiplier = calculateMultiplier(newStreak);
  const basePoints = 10;
  const pointsEarned = Math.floor(basePoints * multiplier);
  
  // Store the check-in record
  await prisma.checkIn.create({
    data: {
      points: pointsEarned,
      signature,
      network,
      userId: user.id
    }
  });

  // Get the previous week's points for history tracking
  const lastWeekPoints = user.points;
  
  // Update user
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      lastCheckIn: new Date(),
      streak: newStreak,
      points: user.points + pointsEarned,
      pointsHistory: {
        lastWeek: lastWeekPoints
      }
    },
  });

  // Get user's rank in leaderboard
  const usersWithHigherPoints = await prisma.user.count({
    where: {
      points: {
        gt: updatedUser.points,
      },
    },
  });

  const userWithRank: UserWithRank = {
    ...updatedUser,
    leaderboardRank: usersWithHigherPoints + 1,
  };

  return NextResponse.json({
    user: userWithRank,
    pointsEarned
  });
}

// Helper function to calculate streak multiplier
function calculateMultiplier(streak: number): number {
  if (streak <= 1) return 1; // Base multiplier
  if (streak <= 3) return 1.25; // 2-3 days streak
  if (streak <= 7) return 1.5; // 4-7 days streak
  if (streak <= 14) return 1.75; // 8-14 days streak
  return 2; // 15+ days streak
}