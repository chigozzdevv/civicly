"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@civic/auth-web3/react';
import { userHasWallet } from '@civic/auth-web3';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction as SolanaTransaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useAccount, useBalance as useEthBalance, useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';
import DashboardLayout from '@/components/dashboard-layout';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet as WalletIcon, 
  RefreshCw, 
  Copy, 
  Check, 
  ExternalLink,
  SwitchCamera,
  X,
  ClipboardCopy
} from 'lucide-react';

type TransactionType = "send" | "receive";
type TransactionStatus = "pending" | "completed" | "failed";

interface TxRecord {
  hash: string;
  type: TransactionType;
  amount: string;
  timestamp: number;
  status: TransactionStatus;
}

export default function WalletPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const networkParam = searchParams.get('network');
  const defaultNetwork = networkParam === 'ethereum' ? 'ethereum' : 'solana';
  
  const [selectedNetwork, setSelectedNetwork] = useState<'ethereum' | 'solana'>(defaultNetwork);
  const userContext = useUser();
  const { publicKey, sendTransaction: sendSolTransaction } = useWallet();
  const { connection } = useConnection();
  const { address: ethAddress } = useAccount();
  const ethBalance = useEthBalance({ address: ethAddress });
  const { sendTransactionAsync } = useSendTransaction();
  
  const [balance, setBalance] = useState<string>("0");
  const [transactions, setTransactions] = useState<TxRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [addressCopied, setAddressCopied] = useState(false);
  
  const isAuthenticated = !!userContext.user;
  const hasWallet = userContext && userHasWallet(userContext);

  const points = typeof userContext.user?.points === 'number' ? userContext.user.points : 0;
  
  const handleNetworkChange = (network: 'ethereum' | 'solana') => {
    setSelectedNetwork(network);
    router.push(`/wallet?network=${network}`, { scroll: false });
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const createWalletIfNeeded = async () => {
      if (userContext.user && !userHasWallet(userContext) && 'createWallet' in userContext) {
        try {
          await userContext.createWallet();
        } catch (error) {
          console.error("Error creating wallet:", error);
        }
      }
    };
    
    createWalletIfNeeded();
  }, [userContext]);

  useEffect(() => {
    const getWalletBalance = async () => {
      if (!hasWallet) return;
      
      setLoading(true);
      try {
        if (selectedNetwork === 'ethereum') {
          if (ethBalance.data) {
            const formatted = ethBalance.data.formatted;
            setBalance(`${parseFloat(formatted).toFixed(4)} ETH`);
          } else if ('ethereum' in userContext) {
            setBalance("0.00 ETH");
          }
        } else {
          if ('solana' in userContext && userContext.solana?.wallet?.publicKey && connection) {
            const balanceInLamports = await connection.getBalance(userContext.solana.wallet.publicKey);
            const balanceInSol = balanceInLamports / LAMPORTS_PER_SOL;
            setBalance(`${balanceInSol.toFixed(4)} SOL`);
          } else if (publicKey && connection) {
            const balanceInLamports = await connection.getBalance(publicKey);
            const balanceInSol = balanceInLamports / LAMPORTS_PER_SOL;
            setBalance(`${balanceInSol.toFixed(4)} SOL`);
          }
        }
      } catch (error) {
        console.error("Error fetching balance:", error);
      } finally {
        setLoading(false);
      }
    };
    
    getWalletBalance();
  }, [hasWallet, userContext, connection, publicKey, ethAddress, ethBalance, selectedNetwork]);

  // Get wallet address safely based on selected network
  const getWalletAddress = useCallback(() => {
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
  }, [selectedNetwork, userContext, ethAddress, publicKey]);

  const walletAddress = getWalletAddress();
  
  // Get shortened wallet address for display
  const getShortAddress = () => {
    if (!walletAddress) return '';
    return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
  };

  // Copy address to clipboard
  const copyAddressToClipboard = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    }
  };

  // Handle send transaction
  const handleSendTransaction = async () => {
    if (!amount || !recipientAddress) {
      setSendError('Please enter recipient address and amount');
      return;
    }
    
    setIsSending(true);
    setSendError('');
    
    try {
      if (selectedNetwork === 'ethereum') {
        // Ethereum transaction
        if ('ethereum' in userContext && sendTransactionAsync) {
          try {
            const hash = await sendTransactionAsync({
              to: recipientAddress as `0x${string}`,
              value: parseEther(amount),
            });
            
            console.log('Transaction sent:', hash);
            
            // Add to local transaction list
            setTransactions(prev => [
              {
                hash,
                type: "send",
                amount: `${amount} ETH`,
                timestamp: Date.now(),
                status: "pending"
              },
              ...prev
            ]);
            
            setShowSendModal(false);
            setRecipientAddress('');
            setAmount('');
          } catch (txError) {
            console.error("Transaction error:", txError);
            setSendError(txError instanceof Error ? txError.message : 'Transaction failed');
          }
        } else {
          setSendError('Wallet not ready');
        }
      } else {
        // Solana transaction
        if ('solana' in userContext && connection) {
          const lamports = parseFloat(amount) * LAMPORTS_PER_SOL;
          
          // Make sure we have a valid wallet publicKey
          if (!userContext.solana.wallet.publicKey) {
            throw new Error('Wallet public key not found');
          }
          
          try {
            // Create a valid PublicKey for recipient
            const recipientPubkey = new PublicKey(recipientAddress);
            
            const transaction = new SolanaTransaction().add(
              SystemProgram.transfer({
                fromPubkey: userContext.solana.wallet.publicKey,
                toPubkey: recipientPubkey,
                lamports: Math.floor(lamports),
              })
            );
            
            // Send transaction and get the signature string
            const signature = await sendSolTransaction(transaction, connection);
            
            console.log('Solana transaction sent:', signature);
            
            // Add to transactions if signature is not null
            if (signature) {
              setTransactions(prev => [
                {
                  hash: signature,
                  type: "send",
                  amount: `${amount} SOL`,
                  timestamp: Date.now(),
                  status: "pending"
                },
                ...prev
              ]);
            }
            
            setShowSendModal(false);
            setRecipientAddress('');
            setAmount('');
          } catch (e) {
            // Handle invalid Solana address
            setSendError('Invalid Solana address');
          }
        }
      }
    } catch (error) {
      console.error("Error sending transaction:", error);
      if (error instanceof Error) {
        setSendError(error.message);
      } else {
        setSendError('Transaction failed');
      }
    } finally {
      setIsSending(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (!hasWallet) {
    return (
      <DashboardLayout 
        selectedNetwork={selectedNetwork} 
        onNetworkChange={handleNetworkChange}
      >
        <div className="flex flex-col items-center justify-center h-64">
          <div className="p-6 bg-white rounded-xl shadow-md max-w-md w-full">
            <div className="flex flex-col items-center text-center">
              <WalletIcon className="h-12 w-12 text-blue-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Setting Up Your Wallet</h2>
              <p className="text-gray-600 mb-4">We're creating a secure wallet for you. This should only take a moment.</p>
              <div className="flex items-center justify-center w-full">
                <div className="h-1 w-full max-w-xs bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 animate-pulse rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      selectedNetwork={selectedNetwork} 
      onNetworkChange={handleNetworkChange}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Wallet Overview Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-5">
            <h1 className="text-2xl font-bold text-white">My Wallet</h1>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column - Address and Network */}
              <div>
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500 mb-1">Network</p>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <p className="font-medium text-gray-900">
                      {selectedNetwork === 'ethereum' ? 'Ethereum' : 'Solana'} Mainnet
                    </p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Wallet Address</p>
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="font-mono text-sm text-gray-800">{getShortAddress()}</p>
                    <button 
                      onClick={copyAddressToClipboard}
                      className="ml-2 text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50 transition-colors"
                    >
                      {addressCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Right column - Balance and Points */}
              <div>
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500 mb-1">Balance</p>
                  <div className="flex items-end">
                    <h2 className="text-2xl font-bold text-gray-900">{balance}</h2>
                    {loading && <RefreshCw className="h-4 w-4 ml-2 mb-1 animate-spin text-gray-400" />}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Points</p>
                  <div className="flex items-center">
                    <h2 className="text-xl font-bold text-gray-900">{points}</h2>
                    <div className="ml-2 bg-amber-100 rounded-full p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => setShowSendModal(true)}
                className="flex items-center justify-center py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
              >
                <ArrowUpRight className="h-5 w-5 mr-2" />
                <span className="font-medium">Send</span>
              </button>
              
              <button 
                onClick={() => setShowReceiveModal(true)}
                className="flex items-center justify-center py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-sm"
              >
                <ArrowDownLeft className="h-5 w-5 mr-2" />
                <span className="font-medium">Receive</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Transaction History */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h2>
            
            {transactions.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {transactions.map((tx) => (
                  <div key={tx.hash} className="py-4 flex justify-between items-center">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.type === "receive" ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        {tx.type === "receive" ? (
                          <ArrowDownLeft className="h-5 w-5 text-green-600" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <div className="ml-4">
                        <p className="font-medium text-gray-900">{tx.type === "receive" ? 'Received' : 'Sent'}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(tx.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        tx.type === "receive" ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {tx.type === "receive" ? '+' : '-'}{tx.amount}
                      </p>
                      <div className="flex items-center justify-end">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                          tx.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {tx.status}
                        </span>
                        <a 
                          href={`https://${selectedNetwork === 'ethereum' ? 'etherscan.io' : 'solscan.io'}/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-gray-500 hover:text-gray-700"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-8 text-center">
                <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                  <SwitchCamera className="h-full w-full" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No transactions yet</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  When you send or receive {selectedNetwork === 'ethereum' ? 'ETH' : 'SOL'}, your transactions will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Redesigned Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Send {selectedNetwork === 'ethereum' ? 'ETH' : 'SOL'}</h3>
              <button 
                onClick={() => {
                  setShowSendModal(false);
                  setSendError('');
                }}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Address</label>
                  <input
                    type="text"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-colors"
                    placeholder={`Enter ${selectedNetwork === 'ethereum' ? 'Ethereum' : 'Solana'} address`}
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-colors pr-14"
                      placeholder="0.00"
                      min="0"
                      step="0.001"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 font-medium">
                      {selectedNetwork === 'ethereum' ? 'ETH' : 'SOL'}
                    </div>
                  </div>
                </div>
                
                {sendError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm flex items-start">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-2">{sendError}</div>
                  </div>
                )}
                
                <div className="flex justify-between space-x-3 pt-2">
                  <button
                    onClick={() => {
                      setShowSendModal(false);
                      setSendError('');
                    }}
                    className="px-4 py-2.5 flex-1 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    disabled={isSending}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendTransaction}
                    className="px-4 py-2.5 flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
                    disabled={isSending || !amount || !recipientAddress}
                  >
                    {isSending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="h-4 w-4 mr-2" />
                        Send
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Redesigned Receive Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Receive {selectedNetwork === 'ethereum' ? 'ETH' : 'SOL'}</h3>
              <button 
                onClick={() => setShowReceiveModal(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your {selectedNetwork === 'ethereum' ? 'Ethereum' : 'Solana'} Address</label>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="break-all font-mono text-sm text-gray-800 mb-3">
                      {walletAddress}
                    </div>
                    <button 
                      onClick={copyAddressToClipboard}
                      className={`flex items-center justify-center w-full p-2.5 rounded-lg text-sm font-medium transition-all ${
                        addressCopied ? 
                        'bg-green-100 text-green-700' : 
                        'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      }`}
                    >
                      {addressCopied ? (
                        <>
                          <Check className="h-4 w-4 mr-1.5" />
                          Copied to clipboard!
                        </>
                      ) : (
                        <>
                          <ClipboardCopy className="h-4 w-4 mr-1.5" />
                          Copy address
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-amber-800">
                        Only send {selectedNetwork === 'ethereum' ? 'Ethereum (ETH)' : 'Solana (SOL)'} to this address. Sending other assets may result in permanent loss.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <button
                    onClick={() => setShowReceiveModal(false)}
                    className="w-full py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-colors font-medium shadow-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}