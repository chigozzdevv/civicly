"use client";

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import Link from 'next/link';
import { UserButton, useUser } from "@civic/auth-web3/react";

export default function LoginPage() {
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

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
          
          <div className="flex justify-center mb-8">
            <UserButton className="w-full py-3 px-4" />
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