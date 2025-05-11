"use client";

import React from 'react';
import { motion } from 'framer-motion';

export default function GridBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base slanted grid */}
      <div className="absolute inset-0 slanted-grid" />
      
      {/* Animated grid glow effect */}
      <motion.div
        className="absolute inset-0 grid-glow"
        initial={{ opacity: 0.7, scale: 0.95 }}
        animate={{ 
          opacity: [0.7, 0.85, 0.7],
          scale: [0.95, 1.05, 0.95],
        }}
        transition={{ 
          duration: 12, 
          repeat: Infinity,
          ease: "easeInOut" 
        }}
      />
      
      {/* Floating particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-orange-500 rounded-full opacity-20"
          initial={{ 
            x: `${Math.random() * 100}%`, 
            y: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.2 + 0.1 
          }}
          animate={{ 
            y: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
            opacity: [Math.random() * 0.15 + 0.05, Math.random() * 0.25 + 0.1, Math.random() * 0.15 + 0.05]
          }}
          transition={{ 
            duration: Math.random() * 20 + 10, 
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut" 
          }}
        />
      ))}
    </div>
  );
}