import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        points: 'desc',
      },
      select: {
        id: true,
        walletAddress: true,
        points: true,
        streak: true,
      },
      take: 20, // Top 20 users
    });

    // Add rank
    const leaderboard = users.map((user, index) => ({
      ...user,
      rank: index + 1,
      walletShort: `${user.walletAddress.slice(0, 4)}...${user.walletAddress.slice(-4)}`,
    }));

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Error in leaderboard API:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}