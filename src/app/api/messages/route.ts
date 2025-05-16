import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const messages = await prisma.message.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            walletAddress: true,
          },
        },
      },
    });
    
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error in messages API:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, content, signature, network = 'solana' } = await req.json();
    
    if (!walletAddress || !content || !signature) {
      return NextResponse.json(
        { error: 'Wallet address, content, and signature are required' },
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
    
    // Create message
    const message = await prisma.message.create({
      data: {
        content,
        signature,
        userId: user.id,
      },
    });
    
    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error in messages API:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}