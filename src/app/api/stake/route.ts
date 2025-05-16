import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, amount, duration, signature, network = 'solana' } = await req.json();
    
    if (!walletAddress || !amount || !duration || !signature) {
      return NextResponse.json(
        { error: 'Wallet address, amount, duration, and signature are required' },
        { status: 400 }
      );
    }

    // Find the user using the compound unique constraint
    const user = await prisma.user.findUnique({
      where: {
        walletAddress_network: {
          walletAddress,
          network
        }
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has enough points
    if (user.points < amount) {
      return NextResponse.json(
        { error: 'Not enough points' },
        { status: 400 }
      );
    }

    // Calculate end date
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + Number(duration));

    // Create stake
    const stake = await prisma.stake.create({
      data: {
        amount: Number(amount),
        endDate,
        signature,
        userId: user.id,
      },
    });

    // Update user points
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        points: user.points - Number(amount),
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

    // Return user with leaderboard rank
    const userWithRank = {
      ...updatedUser,
      leaderboardRank: usersWithHigherPoints + 1,
    };

    return NextResponse.json({ stake, user: userWithRank });
  } catch (error) {
    console.error('Error in stake API:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { walletAddress, stakeId, signature, network = 'solana' } = await req.json();
    
    if (!walletAddress || !stakeId || !signature) {
      return NextResponse.json(
        { error: 'Wallet address, stake ID, and signature are required' },
        { status: 400 }
      );
    }

    // Find the user using the compound unique constraint
    const user = await prisma.user.findUnique({
      where: {
        walletAddress_network: {
          walletAddress,
          network
        }
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find the stake
    const stake = await prisma.stake.findFirst({
      where: { 
        id: stakeId,
        userId: user.id,
        isActive: true
      },
    });

    if (!stake) {
      return NextResponse.json(
        { error: 'Stake not found' },
        { status: 404 }
      );
    }

    // Calculate rewards
    const now = new Date();
    let reward = 0;
    
    if (now >= stake.endDate) {
      // Completed staking period - calculate reward
      const rate = (stake.endDate.getTime() - stake.startDate.getTime()) / (1000 * 60 * 60 * 24) >= 30 ? 0.12 : 0.05;
      reward = Math.floor(stake.amount * rate);
    }

    // Update stake to inactive
    await prisma.stake.update({
      where: { id: stake.id },
      data: { isActive: false },
    });

    // Update user points
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        points: user.points + stake.amount + reward,
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

    // Return user with leaderboard rank
    const userWithRank = {
      ...updatedUser,
      leaderboardRank: usersWithHigherPoints + 1,
    };

    return NextResponse.json({ 
      user: userWithRank,
      unstaked: stake.amount,
      reward
    });
  } catch (error) {
    console.error('Error in unstake API:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

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

    // Find the user using the compound unique constraint
    const user = await prisma.user.findUnique({
      where: {
        walletAddress_network: {
          walletAddress,
          network
        }
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get active stakes
    const stakes = await prisma.stake.findMany({
      where: { 
        userId: user.id,
        isActive: true
      },
    });

    return NextResponse.json({ stakes });
  } catch (error) {
    console.error('Error in get stakes API:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}