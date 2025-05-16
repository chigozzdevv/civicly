import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { User } from '@prisma/client';

type UserWithRank = User & { leaderboardRank: number };

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, network = 'solana' } = await req.json();
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
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
      user = await prisma.user.create({
        data: {
          walletAddress,
          network,
          points: 0,
          streak: 0,
        },
      });
    }

    const usersWithHigherPoints = await prisma.user.count({
      where: {
        points: {
          gt: user.points,
        },
      },
    });

    const userWithRank: UserWithRank = {
      ...user,
      leaderboardRank: usersWithHigherPoints + 1,
    };

    return NextResponse.json({ user: userWithRank });
  } catch (error) {
    console.error('Error in user-data API:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}