import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, email } = await req.json();
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    // Create user if it doesn't exist
    if (!user) {
      user = await prisma.user.create({
        data: { 
          walletAddress,
          email,
          points: 0,
          streak: 0,
        },
      });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error in auth API:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}