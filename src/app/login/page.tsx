"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@civic/auth-web3/react';
import { userHasWallet } from '@civic/auth-web3';
import { useWallet } from '@solana/wallet-adapter-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const userContext = useUser();
  const { publicKey } = useWallet();

  const isAuthenticated = !!userContext.user;

  useEffect(() => {
    const registerUser = async () => {
      if (isAuthenticated && publicKey && userContext.user) {
        try {
          if (userContext.user && !userHasWallet(userContext)) {
            if ('createWallet' in userContext) {
              await userContext.createWallet();
            }
          }

          const response = await fetch('/api/auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              walletAddress: publicKey.toString(),
              email: userContext.user.email,
            }),
          });

          if (response.ok) {
            router.push('/dashboard');
          }
        } catch (error) {
          console.error("Backend registration error:", error);
        }
      }
    };

    registerUser();
  }, [isAuthenticated, publicKey, router, userContext]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleEmailLogin = async () => {
    setIsLoading(true);
    try {
      if (userContext.signIn) {
        await userContext.signIn('iframe');
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      if (userContext.signIn) {
        await userContext.signIn('iframe');
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletLogin = async () => {
    setIsLoading(true);
    try {
      if (userContext.signIn) {
        await userContext.signIn('iframe');
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <div className="absolute top-4 left-4">
        <Link href="/" className="flex items-center">
          <div className="bg-neutral-900 h-8 w-8 rounded flex items-center justify-center text-white font-bold">
            C
          </div>
          <span className="ml-2 text-xl font-semibold">Civicly</span>
        </Link>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <div className="mx-auto w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-neutral-800" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">Welcome to Civicly</h1>
            <p className="text-neutral-600 mt-2">Sign in to continue to your account</p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={handleEmailLogin}
              disabled={isLoading}
              className="w-full bg-white border border-neutral-200 rounded-md py-3 px-4 flex items-center justify-center text-neutral-800 hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mail className="h-5 w-5 mr-3 text-neutral-500" />
              Continue with Email
            </button>
            
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-white border border-neutral-200 rounded-md py-3 px-4 flex items-center justify-center text-neutral-800 hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                {/* Google icon paths */}
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
            
            <button
              onClick={handleWalletLogin}
              disabled={isLoading}
              className="w-full bg-white border border-neutral-200 rounded-md py-3 px-4 flex items-center justify-center text-neutral-800 hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wallet className="h-5 w-5 mr-3 text-neutral-500" />
              Connect Wallet
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-neutral-100 text-center text-sm text-neutral-500">
            <p>
              By continuing, you agree to Civicly&apos;s{' '}
              <Link href="/terms" className="text-neutral-900 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-neutral-900 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
