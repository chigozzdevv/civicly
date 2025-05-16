import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, Wallet, ExternalLink, Copy, CheckCircle, Clock, TrendingUp, CreditCard } from 'lucide-react';

interface WalletDisplayProps {
  address: string;
  network: 'ethereum' | 'solana';
  balance?: string;
  points?: number;
}

export default function WalletDisplay({ address, network, balance = '0', points = 0 }: WalletDisplayProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getExplorerUrl = () => {
    if (network === 'ethereum') {
      return `https://etherscan.io/address/${address}`;
    } else {
      return `https://explorer.solana.com/address/${address}`;
    }
  };

  const getNetworkColor = () => {
    return network === 'ethereum' ? 'bg-blue-500' : 'bg-purple-500';
  };

  const getNetworkName = () => {
    return network === 'ethereum' ? 'Ethereum Mainnet' : 'Solana Mainnet';
  };

  const shortenAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Gradient Header */}
      <div className={`bg-gradient-to-r from-neutral-800 to-neutral-700 p-5 text-white`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Wallet className="h-5 w-5 mr-2 text-orange-400" />
            <h2 className="text-lg font-medium">Wallet</h2>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-500 bg-opacity-20 text-green-100">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-1.5"></div>
              Connected
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white bg-opacity-20">
              <div className={`w-2 h-2 ${getNetworkColor()} rounded-full mr-1.5`}></div>
              {getNetworkName()}
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-5">
        {/* Address Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-neutral-500 mb-2">Wallet Address</h3>
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <span className="font-mono text-sm text-neutral-800">{shortenAddress(address)}</span>
              <div className="flex space-x-1">
                <button 
                  onClick={copyToClipboard}
                  className="p-1.5 bg-white rounded-md text-neutral-500 hover:text-orange-500 border border-neutral-200 transition-colors"
                  title="Copy address"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <a 
                  href={getExplorerUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-white rounded-md text-neutral-500 hover:text-orange-500 border border-neutral-200 transition-colors"
                  title={`View on ${network === 'ethereum' ? 'Etherscan' : 'Solana Explorer'}`}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-neutral-500 mb-2">Network</h3>
            <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
              <div className="flex items-center">
                <div className={`w-3 h-3 ${getNetworkColor()} rounded-full mr-2`}></div>
                <span className="font-medium">{getNetworkName()}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Balance and Points */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-neutral-500">Balance</h3>
              <CreditCard className="h-4 w-4 text-neutral-400" />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-neutral-900">{balance}</div>
              <div className="text-xs px-2 py-1 bg-neutral-200 rounded-full text-neutral-700">
                {network === 'ethereum' ? 'ETH' : 'SOL'}
              </div>
            </div>
          </div>
          
          <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-neutral-500">Points</h3>
              <Coins className="h-4 w-4 text-orange-500" />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-neutral-900">{points}</div>
              {points > 0 && (
                <div className="flex items-center text-green-600 text-xs px-2 py-1 bg-green-100 rounded-full">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>Active</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <a 
            href={`/wallet?network=${network}&action=send`}
            className="flex items-center justify-center py-2.5 px-4 bg-neutral-100 text-neutral-800 rounded-lg hover:bg-neutral-200 transition-colors border border-neutral-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <polyline points="19 12 12 19 5 12"></polyline>
            </svg>
            <span className="font-medium">Send</span>
          </a>
          
          <a 
            href={`/wallet?network=${network}&action=receive`}
            className="flex items-center justify-center py-2.5 px-4 bg-neutral-100 text-neutral-800 rounded-lg hover:bg-neutral-200 transition-colors border border-neutral-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"></line>
              <polyline points="5 12 12 5 19 12"></polyline>
            </svg>
            <span className="font-medium">Receive</span>
          </a>
        </div>
      </div>
    </motion.div>
  );
}