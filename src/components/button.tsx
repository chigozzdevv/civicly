"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  onClick?: () => void;
  className?: string;
  showArrow?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  className = '',
  showArrow = false,
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 overflow-hidden relative';
  
  const variantStyles = {
    primary: 'bg-neutral-900 text-white hover:bg-neutral-800',
    secondary: 'bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50',
  };
  
  const sizeStyles = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-11 px-6 text-base',
    lg: 'h-12 px-8 text-lg',
  };
  
  const styles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;
  
  const textVariants = {
    initial: { opacity: 1, x: 0 },
    hover: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  };
  
  const arrowVariants = {
    initial: { opacity: 0, x: 20 },
    hover: { opacity: 1, x: 0, transition: { duration: 0.2 } }
  };
  
  const buttonContent = (
    <motion.div
      className="relative w-full h-full flex items-center justify-center"
      initial="initial"
      whileHover="hover"
    >
      <motion.div variants={textVariants} className="flex items-center">
        {children}
        {showArrow && (
          <ChevronRight className="ml-2 h-5 w-5" />
        )}
      </motion.div>
      
      <motion.div 
        variants={arrowVariants} 
        className="absolute inset-0 flex items-center justify-center"
      >
        <ChevronRight className="h-6 w-6" />
      </motion.div>
    </motion.div>
  );
  
  if (href) {
    return (
      <Link href={href} className={styles}>
        {buttonContent}
      </Link>
    );
  }
  
  return (
    <button onClick={onClick} className={styles}>
      {buttonContent}
    </button>
  );
}