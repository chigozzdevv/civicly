// components/network-switcher.tsx
import React from 'react';

interface NetworkSwitcherProps {
  selectedNetwork: 'ethereum' | 'solana';
  onChange: (network: 'ethereum' | 'solana') => void;
  minimal?: boolean;
}

export default function NetworkSwitcher({ selectedNetwork, onChange, minimal = false }: NetworkSwitcherProps) {
  return (
    <div className={`flex ${minimal ? 'items-center' : 'flex-col'}`}>
      {!minimal && <label className="text-sm font-medium text-neutral-700 mb-1">Network</label>}
      <div className="relative">
        <select
          value={selectedNetwork}
          onChange={(e) => onChange(e.target.value as 'ethereum' | 'solana')}
          className="bg-neutral-50 border border-neutral-200 text-neutral-900 rounded-md appearance-none py-1.5 pl-3 pr-8 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ethereum">Ethereum</option>
          <option value="solana">Solana</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-700">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M7 7a1 1 0 011.707 0L10 8.414l1.293-1.293a1 1 0 111.414 1.414l-2 2a1 1 0 01-1.414 0l-2-2A1 1 0 017 7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}