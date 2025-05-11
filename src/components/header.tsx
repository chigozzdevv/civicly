"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronDown, Menu, X } from 'lucide-react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <motion.header 
      className="w-full h-16 py-3 px-4 md:px-8 flex items-center justify-between relative z-20"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Link href="/" className="flex items-center z-20">
        <div className="flex items-center mr-2">
          <div className="bg-neutral-900 h-8 w-8 rounded flex items-center justify-center text-white font-bold">
            C
          </div>
        </div>
        <span className="text-xl font-semibold">Civicly</span>
      </Link>
      
      {/* Desktop menu */}
      <div className="hidden md:flex items-center space-x-6">
        <div className="relative group">
          <button className="flex items-center text-neutral-700 hover:text-neutral-900 text-sm md:text-base group">
            What Civicly offers
            <ChevronDown className="h-4 w-4 ml-1 transition-transform group-hover:rotate-180" />
          </button>
          
          <div className="absolute right-0 mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 bg-white border border-neutral-100 rounded-md shadow-lg py-2 z-20">
            <Link href="#features" className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
              Features
            </Link>
            <Link href="#pricing" className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
              Pricing
            </Link>
            <Link href="#docs" className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
              Documentation
            </Link>
          </div>
        </div>
        
        <Link 
          href="/login" 
          className="text-neutral-700 hover:text-neutral-900 text-sm md:text-base relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-neutral-900 after:scale-x-0 after:origin-right after:transition-transform hover:after:scale-x-100 hover:after:origin-left"
        >
          Login
        </Link>
        
        <Link 
          href="/get-started" 
          className="bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 text-neutral-700 hover:bg-neutral-100 transition-colors text-sm md:text-base"
        >
          Get started
        </Link>
      </div>
      
      {/* Mobile menu button */}
      <button 
        className="flex md:hidden z-20 text-neutral-700 hover:text-neutral-900"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>
      
      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            className="fixed inset-0 bg-white z-10 flex flex-col p-6 pt-20"
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex flex-col space-y-4">
              <div className="py-2 border-b border-neutral-100">
                <button 
                  className="flex justify-between items-center w-full py-2 text-neutral-700 hover:text-neutral-900"
                  onClick={() => {}}
                >
                  What Civicly offers
                  <ChevronDown className="h-4 w-4 ml-1" />
                </button>
                
                <div className="pl-4 my-2 space-y-2">
                  <Link
                    href="#features"
                    className="block py-2 text-neutral-600 hover:text-neutral-900"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Features
                  </Link>
                  <Link
                    href="#pricing"
                    className="block py-2 text-neutral-600 hover:text-neutral-900"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Pricing
                  </Link>
                  <Link
                    href="#docs"
                    className="block py-2 text-neutral-600 hover:text-neutral-900"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Documentation
                  </Link>
                </div>
              </div>
              
              <Link
                href="/login"
                className="py-2 text-neutral-700 hover:text-neutral-900 border-b border-neutral-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              
              <Link
                href="/get-started"
                className="py-2 text-neutral-700 hover:text-neutral-900 border-b border-neutral-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}