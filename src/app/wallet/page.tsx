"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@civic/auth-web3/react';
import { userHasWallet } from '@civic/auth-web3';
import { useConnection } from '@solana/wallet-adapter-react';
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
  X
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
  const { connection } = useConnection();
  const { address: ethAddress } = useAccount();
  const ethBalance = useEthBalance({ address: ethAddress });
  const { sendTransactionAsync } = useSendTransaction();
  
  const [balance, setBalance] = useState<string>("0");
  const [rawBalance, setRawBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<TxRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [addressCopied, setAddressCopied] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  
  const isAuthenticated = !!userContext.user;
  const hasWallet = userContext.user && userHasWallet(userContext);

  const points = userPoints || (typeof userContext.user?.points === 'number' ? userContext.user.points : 0);
  
  const handleNetworkChange = (network: 'ethereum' | 'solana') => {
    setSelectedNetwork(network);
    router.push(`/wallet?network=${network}`, { scroll: false });
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const getWalletAddress = useCallback(() => {
    if (!userHasWallet(userContext)) return '';
    
    if (selectedNetwork === 'ethereum' && 'ethereum' in userContext) {
      return userContext.ethereum.address;
    } else if (selectedNetwork === 'solana' && 'solana' in userContext) {
      return userContext.solana.address;
    }
    return '';
  }, [selectedNetwork, userContext]);

  const walletAddress = getWalletAddress();

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
    const fetchInitialBalance = async () => {
      if (!hasWallet) return;
      
      setLoading(true);
      try {
        if (selectedNetwork === 'ethereum') {
          if (userHasWallet(userContext) && 'ethereum' in userContext) {
            if (ethBalance.data) {
              const formatted = ethBalance.data.formatted;
              setBalance(`${parseFloat(formatted).toFixed(4)} ETH`);
              setRawBalance(Number(ethBalance.data.value));
            } else {
              setBalance("0.0000 ETH");
              setRawBalance(0);
            }
          }
        } else {
          if (userHasWallet(userContext) && 'solana' in userContext && connection) {
            try {
              let balanceInLamports: number;
              
              if (userContext.solana.wallet.publicKey) {
                balanceInLamports = await connection.getBalance(userContext.solana.wallet.publicKey);
              } else {
                const pubKey = new PublicKey(userContext.solana.address);
                balanceInLamports = await connection.getBalance(pubKey);
              }
              
              const balanceInSol = balanceInLamports / LAMPORTS_PER_SOL;
              setBalance(`${balanceInSol.toFixed(4)} SOL`);
              setRawBalance(balanceInLamports);
            } catch (balanceError) {
              console.error("Error fetching Solana balance:", balanceError);
              setBalance("0.0000 SOL");
              setRawBalance(0);
            }
          }
        }
      } catch (error) {
        console.error("Error in initial balance fetch:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (hasWallet && walletAddress) {
      fetchInitialBalance();
    }
  }, [hasWallet, selectedNetwork, walletAddress]);

  useEffect(() => {
    const fetchInitialUserData = async () => {
      if (!walletAddress) return;
      
      try {
        const response = await fetch('/api/user-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress, network: selectedNetwork }),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.user && typeof data.user.points === 'number') {
            setUserPoints(data.user.points);
          }
        }
      } catch (error) {
        console.error("Error fetching initial user data:", error);
      }
    };
    
    if (walletAddress) {
      fetchInitialUserData();
    }
  }, [walletAddress, selectedNetwork]);

  const getShortAddress = () => {
    if (!walletAddress) return '';
    return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
  };

  const copyAddressToClipboard = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    }
  };

  const handleRefresh = async () => {
    if (refreshing || loading) return;
    
    setRefreshing(true);
    
    try {
      if (selectedNetwork === 'ethereum') {
        if (userHasWallet(userContext) && 'ethereum' in userContext) {
          ethBalance.refetch?.();
        }
      } else {
        if (userHasWallet(userContext) && 'solana' in userContext && connection) {
          try {
            let balanceInLamports: number;
            
            if (userContext.solana.wallet.publicKey) {
              balanceInLamports = await connection.getBalance(userContext.solana.wallet.publicKey);
            } else {
              const pubKey = new PublicKey(userContext.solana.address);
              balanceInLamports = await connection.getBalance(pubKey);
            }
            
            const balanceInSol = balanceInLamports / LAMPORTS_PER_SOL;
            setBalance(`${balanceInSol.toFixed(4)} SOL`);
            setRawBalance(balanceInLamports);
          } catch (error) {
            console.error("Error refreshing Solana balance:", error);
          }
        }
      }
      
      if (walletAddress) {
        try {
          const response = await fetch('/api/user-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress, network: selectedNetwork }),
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.user && typeof data.user.points === 'number') {
              setUserPoints(data.user.points);
            }
          }
        } catch (error) {
          console.error("Error refreshing user data:", error);
        }
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleSendTransaction = async () => {
    if (!amount || !recipientAddress) {
      setSendError('Please enter recipient address and amount');
      return;
    }
    
    setIsSending(true);
    setSendError('');
    
    try {
      if (selectedNetwork === 'ethereum') {
        if (userHasWallet(userContext) && 'ethereum' in userContext && sendTransactionAsync) {
          try {
            const amountInWei = parseEther(amount);
            
            const estimatedGas = BigInt(21000);
            const gasPriceWei = BigInt(15000000000);
            const estimatedFee = estimatedGas * gasPriceWei;
            const totalCost = amountInWei + estimatedFee;
            
            if (BigInt(rawBalance) < totalCost) {
              setSendError(`Insufficient funds for this transaction. You need approximately ${(Number(totalCost) / 1e18).toFixed(6)} ETH (including gas).`);
              setIsSending(false);
              return;
            }
            
            const hash = await sendTransactionAsync({
              to: recipientAddress as `0x${string}`,
              value: amountInWei,
            });
            
            setTransactions(prev => [{
              hash,
              type: "send",
              amount: `${amount} ETH`,
              timestamp: Date.now(),
              status: "pending"
            }, ...prev]);
            
            setShowSendModal(false);
            setRecipientAddress('');
            setAmount('');
          } catch (txError) {
            setSendError(txError instanceof Error ? txError.message : 'Transaction failed');
          }
        } else {
          setSendError('Ethereum wallet not ready');
        }
      } else {
        if ('solana' in userContext && userContext.solana.wallet) {
          try {
            const { publicKey } = userContext.solana.wallet;
            
            if (!publicKey) {
              throw new Error('Wallet not ready');
            }
            
            let toPubkey: PublicKey;
            try {
              toPubkey = new PublicKey(recipientAddress);
            } catch (e) {
              setSendError('Invalid Solana address');
              setIsSending(false);
              return;
            }
            
            const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);
            if (isNaN(lamports) || lamports <= 0) {
              setSendError('Invalid amount');
              setIsSending(false);
              return;
            }
            
            const estimatedFee = 5000;
            if (rawBalance < (lamports + estimatedFee)) {
              setSendError(`Insufficient funds for this transaction. You need approximately ${((lamports + estimatedFee) / LAMPORTS_PER_SOL).toFixed(6)} SOL (including fees).`);
              setIsSending(false);
              return;
            }
            
            const transaction = new SolanaTransaction().add(
              SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: toPubkey,
                lamports: lamports,
              })
            );
            
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;
            
            if ('signTransaction' in userContext.solana.wallet) {
              const signedTransaction = await userContext.solana.wallet.signTransaction(transaction);
              const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
                skipPreflight: false,
                preflightCommitment: 'finalized',
                maxRetries: 3
              });
              
              if (signature) {
                setTransactions(prev => [{
                  hash: signature,
                  type: "send",
                  amount: `${amount} SOL`,
                  timestamp: Date.now(),
                  status: "pending"
                }, ...prev]);
                
                setShowSendModal(false);
                setRecipientAddress('');
                setAmount('');
              }
            } else {
              throw new Error('Wallet does not support transaction signing');
            }
          } catch (txError) {
            console.error("Solana transaction error:", txError);
            const errorMessage = txError instanceof Error ? txError.message : 'Transaction failed';
            
            if (errorMessage.includes('insufficient')) {
              setSendError('Insufficient funds for this transaction');
            } else if (errorMessage.includes('blockhash') || errorMessage.includes('expired')) {
              setSendError('Transaction expired. Please try again.');
            } else if (errorMessage.includes('emit')) {
              setSendError('Wallet connection error. Please refresh the page and try again.');
            } else {
              setSendError(errorMessage);
            }
          }
        } else {
          setSendError('Solana wallet not ready');
        }
      }
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Transaction failed');
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
        <div className="flex flex-col items-center justify-center h-64 mt-16 md:mt-0">
          <div className="p-6 bg-neutral-50 rounded-lg border border-neutral-200 max-w-md w-full">
            <div className="flex flex-col items-center text-center">
              <WalletIcon className="h-12 w-12 text-orange-500 mb-4" />
              <h2 className="text-xl font-medium text-neutral-800 mb-3">Setting Up Your Wallet</h2>
              <p className="text-neutral-600 mb-4">This should only take a moment.</p>
              <div className="flex items-center">
                <RefreshCw className="h-5 w-5 mr-2 animate-spin text-orange-500" />
                <p className="text-neutral-600">Please wait</p>
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
      <div className="max-w-4xl mx-auto px-4 py-6 mt-16 md:mt-0">
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden mb-6">
          <div className="flex items-center justify-between p-5 border-b border-neutral-200">
            <h1 className="text-xl font-medium text-neutral-800">Wallet</h1>
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleRefresh}
                className="p-2 rounded-md hover:bg-neutral-100 text-neutral-500 transition-colors"
                title="Refresh data"
                disabled={refreshing || loading}
              >
                <RefreshCw className={`h-4 w-4 ${(refreshing || loading) ? 'animate-spin text-orange-500' : ''}`} />
              </button>
              <div className="px-3 py-1 rounded-full bg-neutral-100 flex items-center text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <span className="text-neutral-600">{selectedNetwork === 'ethereum' ? 'Ethereum' : 'Solana'} Mainnet</span>
              </div>
            </div>
          </div>
          
          <div className="px-5 pt-5 pb-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm text-neutral-500">Address</p>
                  <div className="flex items-center">
                    <span className="font-mono text-sm text-neutral-800 mr-2">{getShortAddress()}</span>
                    <button 
                      onClick={copyAddressToClipboard}
                      className="text-neutral-400 hover:text-orange-500 transition-colors"
                    >
                      {addressCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm text-neutral-500">Balance</p>
                  <div className="flex items-center">
                    <span className="text-xl font-medium text-neutral-800">{balance}</span>
                    {loading && <RefreshCw className="h-4 w-4 ml-2 animate-spin text-neutral-400" />}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-5 flex items-center space-x-3">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-orange-500 mr-2"></div>
                <span className="text-sm text-neutral-600">
                  {refreshing ? (
                    <span className="flex items-center">
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Updating...
                    </span>
                  ) : (
                    `${points} points`
                  )}
                </span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 border-t border-neutral-200">
            <button 
              onClick={() => setShowSendModal(true)}
              className="py-3 px-5 flex items-center justify-center text-neutral-800 hover:bg-neutral-50 transition-colors border-r border-neutral-200"
            >
              <ArrowUpRight className="h-5 w-5 mr-2 text-orange-500" />
              <span className="font-medium">Send</span>
            </button>
            
            <button 
              onClick={() => setShowReceiveModal(true)}
              className="py-3 px-5 flex items-center justify-center text-neutral-800 hover:bg-neutral-50 transition-colors"
            >
              <ArrowDownLeft className="h-5 w-5 mr-2 text-orange-500" />
              <span className="font-medium">Receive</span>
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-neutral-200">
            <h2 className="text-lg font-medium text-neutral-800">Transaction History</h2>
          </div>
          
          <div className="p-5">
            {transactions.length > 0 ? (
              <div className="divide-y divide-neutral-100">
                {transactions.map((tx) => (
                  <div key={tx.hash} className="py-4 flex justify-between items-center">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        tx.type === "receive" ? 'bg-green-100' : 'bg-orange-100'
                      }`}>
                        {tx.type === "receive" ? (
                          <ArrowDownLeft className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-neutral-800">{tx.type === "receive" ? 'Received' : 'Sent'}</p>
                        <p className="text-xs text-neutral-500">
                          {new Date(tx.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        tx.type === "receive" ? 'text-green-600' : 'text-orange-500'
                      }`}>
                        {tx.type === "receive" ? '+' : '-'}{tx.amount}
                      </p>
                      <div className="flex items-center justify-end">
                        <span className={`text-xs ${
                          tx.status === 'completed' ? 'text-green-600' :
                          tx.status === 'pending' ? 'text-amber-600' :
                          'text-red-600'
                        }`}>
                          {tx.status}
                        </span>
                        <a 
                          href={`https://${selectedNetwork === 'ethereum' ? 'etherscan.io' : 'solscan.io'}/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-neutral-400 hover:text-neutral-600"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                  <SwitchCamera className="h-6 w-6 text-neutral-400" />
                </div>
                <h3 className="text-lg font-medium text-neutral-800 mb-1">No transactions yet</h3>
                <p className="text-neutral-500 max-w-sm mx-auto text-sm">
                  When you send or receive {selectedNetwork === 'ethereum' ? 'ETH' : 'SOL'}, your transactions will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-neutral-800">Send {selectedNetwork === 'ethereum' ? 'ETH' : 'SOL'}</h3>
              <button 
                onClick={() => {
                  setShowSendModal(false);
                  setSendError('');
                }}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Recipient Address</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-neutral-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:outline-none transition-colors"
                    placeholder={`Enter ${selectedNetwork === 'ethereum' ? 'Ethereum' : 'Solana'} address`}
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full p-3 border border-neutral-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:outline-none transition-colors pr-14"
                      placeholder="0.00"
                      min="0"
                      step="0.001"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-500 font-medium">
                      {selectedNetwork === 'ethereum' ? 'ETH' : 'SOL'}
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Available: {balance}
                  </p>
                </div>
                
                {sendError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                    {sendError}
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    onClick={() => {
                      setShowSendModal(false);
                      setSendError('');
                    }}
                    className="px-4 py-2 border border-neutral-300 rounded-md text-neutral-700 font-medium hover:bg-neutral-50 transition-colors"
                    disabled={isSending}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendTransaction}
                    className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
                    disabled={isSending || !amount || !recipientAddress}
                  >
                    {isSending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showReceiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-neutral-800">Receive {selectedNetwork === 'ethereum' ? 'ETH' : 'SOL'}</h3>
              <button 
                onClick={() => setShowReceiveModal(false)}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Your {selectedNetwork === 'ethereum' ? 'Ethereum' : 'Solana'} Address</label>
                  <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200">
                    <p className="break-all font-mono text-sm text-neutral-800 mb-3">
                      {walletAddress}
                    </p>
                    <button 
                      onClick={copyAddressToClipboard}
                      className={`flex items-center justify-center w-full p-2 rounded-md text-sm font-medium transition-colors ${
                        addressCopied ? 
                        'bg-green-100 text-green-700' : 
                        'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      {addressCopied ? (
                        <>
                          <Check className="h-4 w-4 mr-1.5" />
                          Copied to clipboard
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1.5" />
                          Copy address
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="bg-amber-50 border border-amber-100 rounded-md p-3">
                  <p className="text-sm text-amber-800">
                    Only send {selectedNetwork === 'ethereum' ? 'Ethereum (ETH)' : 'Solana (SOL)'} to this address. Sending other assets may result in permanent loss.
                  </p>
                </div>
                
                <div className="pt-2">
                  <button
                    onClick={() => setShowReceiveModal(false)}
                    className="w-full py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors font-medium"
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