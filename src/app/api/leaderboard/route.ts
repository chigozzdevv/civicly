import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const network = searchParams.get('network') || 'solana';
    
    // Fetch users ordered by points
    const users = await prisma.user.findMany({
      where: {
        network
      },
      orderBy: {
        points: 'desc',
      },
      select: {
        id: true,
        walletAddress: true,
        network: true,
        points: true,
        streak: true,
      },
      take: 20, // Top 20 users
    });
    
    // Add rank and formatted wallet address
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