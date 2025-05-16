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

    // Find the user
    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      // Create user if not found
      const newUser = await prisma.user.create({
        data: {
          walletAddress,
          points: 0,
          streak: 0,
        },
      });
      
      // Continue with the new user
      return handleCheckin(newUser);
    }

    return handleCheckin(user);
  } catch (error) {
    console.error('Error in check-in API:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

type UserWithRank = User & { leaderboardRank: number };

async function handleCheckin(user: User): Promise<NextResponse<{ user: UserWithRank, pointsEarned: number }>> {
  // Check if already checked in today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (user.lastCheckIn) {
    const lastCheckIn = new Date(user.lastCheckIn);
    lastCheckIn.setHours(0, 0, 0, 0);
    
    if (today.getTime() === lastCheckIn.getTime()) {
      return NextResponse.json(
        { error: 'Already checked in today' },
        { status: 400 }
      ) as any; // Type cast needed due to error response not matching return type
    }
  }

  // Calculate streak
  let newStreak = 1;
  if (user.lastCheckIn) {
    const lastCheckIn = new Date(user.lastCheckIn);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Convert dates to match format for comparison
    const lastCheckInTime = new Date(lastCheckIn).setHours(0, 0, 0, 0);
    const yesterdayTime = new Date(yesterday).setHours(0, 0, 0, 0);
    
    if (lastCheckInTime === yesterdayTime) {
      newStreak = user.streak + 1;
    }
  }

  // Calculate points (base 10 * streak multiplier)
  const pointsEarned = 10 * newStreak;

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      lastCheckIn: new Date(),
      streak: newStreak,
      points: user.points + pointsEarned,
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