import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, Wallet, ExternalLink, Copy, CheckCircle } from 'lucide-react';

interface WalletDisplayProps {
  address: string;
  network: 'ethereum' | 'solana';
  balance?: string;
  points?: number;
}

export default function WalletDisplay({ address, network, balance = '0', points = 0 }: WalletDisplayProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getExplorerUrl = () => {
    if (network === 'ethereum') {
      return `https://etherscan.io/address/${address}`;
    } else {
      return `https://explorer.solana.com/address/${address}`;
    }
  };

  const getNetworkIcon = () => {
    return network === 'ethereum' ? 
      <span className="w-2 h-2 bg-blue-500 rounded-full mr-1.5"></span> : 
      <span className="w-2 h-2 bg-purple-500 rounded-full mr-1.5"></span>;
  };

  const getNetworkName = () => {
    // FIX: Changed from "Solana Devnet" to just "Solana"
    return network === 'ethereum' ? 'Ethereum Mainnet' : 'Solana';
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-xl font-bold">My Wallet</h2>
            <p className="text-neutral-600 flex items-center">
              {getNetworkIcon()}
              {getNetworkName()}
            </p>
          </div>
          
          <div className="flex items-center mt-2 md:mt-0 space-x-2">
            <span className="inline-flex items-center bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
              Connected
            </span>
            <span className="inline-flex items-center bg-neutral-100 text-neutral-800 text-xs px-2.5 py-1 rounded-full">
              <Coins className="w-3 h-3 mr-1" />
              {points} points
            </span>
          </div>
        </div>
        
        <div className="bg-neutral-50 p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-neutral-500">Wallet Address</h3>
            <div className="flex space-x-1">
              <button 
                onClick={copyToClipboard}
                className="p-1 text-neutral-500 hover:text-neutral-700 transition-colors"
                title="Copy address"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
              <a 
                href={getExplorerUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 text-neutral-500 hover:text-neutral-700 transition-colors"
                title={`View on ${network === 'ethereum' ? 'Etherscan' : 'Solana Explorer'}`}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
          <p className="font-mono text-sm truncate">{address}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-neutral-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-neutral-500 mb-1">Total Balance</h3>
            <div className="text-2xl font-bold">{balance}</div>
          </div>
          
          <div className="bg-neutral-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-neutral-500 mb-1">Total Points</h3>
            <div className="text-2xl font-bold flex items-center">
              {points}
              <Coins className="h-5 w-5 ml-1 text-orange-500" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}