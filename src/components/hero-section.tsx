"use client";
import Link from 'next/link';
import React from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import Button from './button';

export default function HeroSection() {
  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  return (
    <section className="py-8 md:py-16 px-4 md:px-8 max-w-screen-xl mx-auto text-center h-[calc(100vh-64px)] flex flex-col justify-center">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
        className="flex flex-col items-center"
      >
        <motion.h2 
          variants={fadeInUp}
          className="text-neutral-400 text-xl md:text-2xl mb-4 md:mb-6"
        >
          Meet Civicly
        </motion.h2>
        
        <motion.div
          variants={fadeInUp}
          className="mb-4 md:mb-8"
        >
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-neutral-900">
            <div className="mb-1">The best way to</div>
            <div className="mb-1">experience civic</div>
            <div className="inline-flex items-center">
              <Lock className="h-7 w-7 md:h-8 md:w-8 text-orange-500 mr-1" />
              <span>uth</span>
            </div>
          </h1>
        </motion.div>
        
        <motion.div 
          variants={fadeInUp}
          className="max-w-2xl mx-auto mb-8 md:mb-10"
        >
          <p className="text-base md:text-lg text-neutral-600">
            With Civicly, you get to see civic auths in action in the real world. And
            guess what? While those are neat examples, civic auth is really built to
            cover all your Web3 auth needs.
          </p>
        </motion.div>
        
        <motion.div variants={fadeInUp} className="flex justify-center">
          <Button 
            variant="primary"
            size="lg"
            href="/login"
            showArrow={true}
          >
            Try Civicly Now
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}