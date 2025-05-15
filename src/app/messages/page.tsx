"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  CalendarCheck, MessageSquare, Coins, Trophy, LogOut, 
  Send, User, RefreshCw 
} from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@civic/auth-web3/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { TextEncoder } from 'util';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  user: {
    walletAddress: string;
  };
}

export default function MessagesPage() {
  const router = useRouter();
  const userContext = useUser();
  const { publicKey, signMessage } = useWallet();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  
  const isAuthenticated = !!userContext.user;
  
  // Protect route
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Load messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('/api/messages');
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    
    fetchMessages();
  }, []);

  const handlePostMessage = async () => {
    if (!publicKey || !signMessage || !newMessage.trim()) return;
    
    setIsPosting(true);
    try {
      // Create message to sign
      const timestamp = new Date().toISOString();
      const messageToSign = `Civicly message post: ${newMessage} at ${timestamp}`;
      
      // Sign the message with the wallet
      const encodedMessage = new TextEncoder().encode(messageToSign);
      const signature = await signMessage(encodedMessage);
      
      // Send to backend
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          content: newMessage,
          signature: Buffer.from(signature).toString('base64'),
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Refresh messages
        const messagesResponse = await fetch('/api/messages');
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          setMessages(messagesData.messages);
        }
        
        // Clear input
        setNewMessage('');
      }
    } catch (error) {
      console.error("Message posting error:", error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleLogout = async () => {
    if (userContext.signOut) {
      await userContext.signOut();
    }
    router.push('/');
  };

  if (!isAuthenticated) {
    return null; // Will redirect in the useEffect
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Sidebar - Same as in dashboard */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r border-neutral-200">
        <div className="p-4 border-b border-neutral-200">
          <Link href="/" className="flex items-center">
            <div className="bg-neutral-900 h-8 w-8 rounded flex items-center justify-center text-white font-bold">
              C
            </div>
            <span className="ml-2 text-xl font-semibold">Civicly</span>
          </Link>
        </div>
        
        <div className="flex-1 py-4">
          <nav className="px-4 space-y-1">
            <Link href="/dashboard" className="flex items-center px-2 py-2 text-neutral-600 hover:bg-neutral-100 rounded-md">
              <CalendarCheck className="mr-3 h-5 w-5 text-neutral-500" />
              Daily Check-in
            </Link>
            <Link href="/messages" className="flex items-center px-2 py-2 text-neutral-900 rounded-md bg-neutral-100">
              <MessageSquare className="mr-3 h-5 w-5 text-neutral-500" />
              Message Board
            </Link>
            <Link href="/staking" className="flex items-center px-2 py-2 text-neutral-600 hover:bg-neutral-100 rounded-md">
              <Coins className="mr-3 h-5 w-5 text-neutral-500" />
              Staking
            </Link>
            <Link href="/leaderboard" className="flex items-center px-2 py-2 text-neutral-600 hover:bg-neutral-100 rounded-md">
              <Trophy className="mr-3 h-5 w-5 text-neutral-500" />
              Leaderboard
            </Link>
          </nav>
        </div>
        
        <div className="p-4 border-t border-neutral-200">
          <button
            onClick={handleLogout}
            className="flex items-center px-2 py-2 w-full text-neutral-600 hover:bg-neutral-100 rounded-md"
          >
            <LogOut className="mr-3 h-5 w-5 text-neutral-500" />
            Logout
          </button>
        </div>
      </div>
      
      {/* Mobile header - Same as in dashboard */}
      <div className="md:hidden fixed top-0 inset-x-0 z-10 bg-white border-b border-neutral-200 p-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <div className="bg-neutral-900 h-8 w-8 rounded flex items-center justify-center text-white font-bold">
              C
            </div>
            <span className="ml-2 text-xl font-semibold">Civicly</span>
          </Link>
          
          <button
            onClick={handleLogout}
            className="p-2 text-neutral-600 hover:text-neutral-900"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Mobile navigation - Same as in dashboard but with 'messages' active */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-10 bg-white border-t border-neutral-200 p-2">
        <div className="flex justify-around">
          <Link href="/dashboard" className="p-2 text-neutral-600 flex flex-col items-center">
            <CalendarCheck className="h-6 w-6" />
            <span className="text-xs mt-1">Check-in</span>
          </Link>
          <Link href="/messages" className="p-2 text-neutral-900 flex flex-col items-center">
            <MessageSquare className="h-6 w-6" />
            <span className="text-xs mt-1">Messages</span>
          </Link>
          <Link href="/staking" className="p-2 text-neutral-600 flex flex-col items-center">
            <Coins className="h-6 w-6" />
            <span className="text-xs mt-1">Staking</span>
          </Link>
          <Link href="/leaderboard" className="p-2 text-neutral-600 flex flex-col items-center">
            <Trophy className="h-6 w-6" />
            <span className="text-xs mt-1">Leaders</span>
          </Link>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 md:ml-64 pt-16 md:pt-0">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-6">Community Message Board</h1>
            
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-8">
              <h2 className="text-lg font-medium text-neutral-900 mb-4">Post a Message</h2>
              <div className="space-y-4">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none"
                  rows={3}
                  disabled={isPosting}
                ></textarea>
                
                <div className="flex justify-between items-center">
                  <p className="text-sm text-neutral-500">
                    Messages are signed with your wallet
                  </p>
                  
                  <button
                    onClick={handlePostMessage}
                    disabled={isPosting || !newMessage.trim() || !publicKey || !signMessage}
                    className="bg-neutral-900 text-white py-2 px-4 rounded-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-800 transition-colors"
                  >
                    {isPosting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Signing...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Post Message
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 text-center">
                  <MessageSquare className="h-10 w-10 mx-auto text-neutral-300 mb-2" />
                  <h3 className="text-lg font-medium text-neutral-900">No messages yet</h3>
                  <p className="text-neutral-600">Be the first to post a message!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6"
                  >
                    <div className="flex items-start">
                      <div className="bg-neutral-100 rounded-full h-10 w-10 flex items-center justify-center mr-3 flex-shrink-0">
                        <User className="h-5 w-5 text-neutral-500" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-neutral-900 truncate">
                            {`${message.user.walletAddress.slice(0, 4)}...${message.user.walletAddress.slice(-4)}`}
                          </h3>
                          <span className="text-xs text-neutral-500">
                            {new Date(message.createdAt).toLocaleString()}
                          </span>
                        </div>
                        
                        <p className="text-neutral-800 whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}