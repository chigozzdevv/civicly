import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get('walletAddress');
    const network = searchParams.get('network') || 'solana';
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Simplified query that only uses walletAddress and network
    const user = await prisma.user.findFirst({
      where: {
        walletAddress,
        network
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get the user's check-in history
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const checkIns = await prisma.checkIn.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: sevenDaysAgo
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
    });

    // Format the history
    const history = [];
    const today = new Date();
    
    // Build an array of the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      // Check if the user checked in on this day
      const checked = checkIns.some(checkIn => {
        const checkInDate = new Date(checkIn.createdAt);
        checkInDate.setHours(0, 0, 0, 0);
        return checkInDate.getTime() === date.getTime();
      });
      
      history.push({
        date: date.toISOString().split('T')[0],
        checked
      });
    }

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching check-in history:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}