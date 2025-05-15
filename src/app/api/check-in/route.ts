import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, signature, message } = await req.json();
    
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
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

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
        );
      }
    }

    // Calculate streak
    let newStreak = 1;
    if (user.lastCheckIn) {
      const lastCheckIn = new Date(user.lastCheckIn);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastCheckIn.setHours(0, 0, 0, 0) === yesterday.setHours(0, 0, 0, 0)) {
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

    return NextResponse.json({ 
      user: updatedUser,
      pointsEarned
    });
  } catch (error) {
    console.error('Error in check-in API:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}