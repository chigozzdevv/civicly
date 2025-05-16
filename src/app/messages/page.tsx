"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageSquare, User, RefreshCw, Send } from 'lucide-react';
import { useUser } from '@civic/auth-web3/react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useAccount } from 'wagmi';
import DashboardLayout from '@/components/dashboard-layout';

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
  const searchParams = useSearchParams();
  const networkParam = searchParams.get('network');
  const selectedNetwork = networkParam === 'ethereum' ? 'ethereum' : 'solana';
  
  const userContext = useUser();
  const { publicKey, signMessage: solanaSignMessage } = useWallet();
  const { connection } = useConnection();
  const { address: ethAddress } = useAccount();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [signError, setSignError] = useState('');
  
  const isAuthenticated = !!userContext.user;

  const handleNetworkChange = (network: 'ethereum' | 'solana') => {
    router.push(`/messages?network=${network}`, { scroll: false });
  };
  
  // Protect route
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Get wallet address safely based on selected network
  const getWalletAddress = () => {
    if (selectedNetwork === 'ethereum') {
      if ('ethereum' in userContext) {
        return userContext.ethereum.address;
      } else if (ethAddress) {
        return ethAddress;
      }
    } else { // solana
      if ('solana' in userContext) {
        return userContext.solana.address;
      } else if (publicKey) {
        return publicKey.toString();
      }
    }
    return '';
  };

  const walletAddress = getWalletAddress();

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
    if (!walletAddress || !newMessage.trim()) return;
    
    setIsPosting(true);
    setSignError('');
    
    try {
      let signature;
      
      // Create message to sign
      const timestamp = new Date().toISOString();
      const messageToSign = `Civicly message post: ${newMessage} at ${timestamp}`;
      
      // Sign with the appropriate wallet based on network
      if (selectedNetwork === 'ethereum') {
        if ('ethereum' in userContext && userContext.ethereum.wallet) {
          signature = await userContext.ethereum.wallet.signMessage({
            message: messageToSign,
            account: userContext.ethereum.address
          });
        } else {
          throw new Error("No Ethereum wallet available for signing");
        }
      } else { // Solana
        if ('solana' in userContext && userContext.solana.wallet) {
          // Use TextEncoder to convert the message to bytes
          const messageBytes = new TextEncoder().encode(messageToSign);
          
          try {
            // Try signing with the Civic Auth wallet
            const signatureBytes = await userContext.solana.wallet.signMessage(messageBytes);
            signature = Buffer.from(signatureBytes).toString('base64');
          } catch (solanaError) {
            console.error("Error signing with Civic Solana wallet:", solanaError);
            
            // Try fallback to adapter if available
            if (solanaSignMessage && publicKey) {
              const signatureBytes = await solanaSignMessage(messageBytes);
              signature = Buffer.from(signatureBytes).toString('base64');
            } else {
              throw new Error("Failed to sign with Solana wallet");
            }
          }
        } else if (solanaSignMessage && publicKey) {
          // Use adapter wallet if Civic wallet not available
          const messageBytes = new TextEncoder().encode(messageToSign);
          const signatureBytes = await solanaSignMessage(messageBytes);
          signature = Buffer.from(signatureBytes).toString('base64');
        } else {
          throw new Error("No Solana wallet available for signing");
        }
      }
      
      // Check if we have a signature
      if (!signature) {
        throw new Error("Failed to get signature from wallet");
      }
      
      // Send to backend
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          content: newMessage,
          signature,
          network: selectedNetwork
        }),
      });
      
      if (response.ok) {
        // Refresh messages
        const messagesResponse = await fetch('/api/messages');
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          setMessages(messagesData.messages);
        }
        
        // Clear input
        setNewMessage('');
      } else {
        const errorData = await response.json();
        setSignError(errorData.error || "Failed to post message");
      }
    } catch (error) {
      console.error("Message posting error:", error);
      setSignError(error instanceof Error ? error.message : "Failed to sign message");
    } finally {
      setIsPosting(false);
    }
  };

  if (!isAuthenticated) {
    return null; 
  }

  return (
    <DashboardLayout
      selectedNetwork={selectedNetwork}
      onNetworkChange={handleNetworkChange}
    >
      <div className="max-w-4xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-6">Community Message Board</h1>
          
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-8">
            <h2 className="text-lg font-medium text-neutral-900 mb-4">Post a Message</h2>
            <div className="space-y-4">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                rows={3}
                disabled={isPosting}
              ></textarea>
              
              {signError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                  {signError}
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <p className="text-sm text-neutral-500">
                  Messages are signed with your {selectedNetwork === 'ethereum' ? 'Ethereum' : 'Solana'} wallet
                </p>
                
                <button
                  onClick={handlePostMessage}
                  disabled={isPosting || !newMessage.trim() || !walletAddress}
                  className="bg-orange-500 text-white py-2 px-4 rounded-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors"
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
              <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 text-center">
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
                  className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6"
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
    </DashboardLayout>
  );
}