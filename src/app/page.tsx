'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready: () => void;
        MainButton: {
          setText: (text: string) => void;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
        };
        initDataUnsafe: {
          user?: {
            id: number;
          };
        };
      };
    };
  }
}

export default function GoldStaterApp() {
  const [goldStaters, setGoldStaters] = useState(0)
  const [lastClaimTime, setLastClaimTime] = useState(0)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [telegramId, setTelegramId] = useState<number | null>(null)

  const fetchUserData = useCallback(async (tgId: number) => {
    const { data, error } = await supabase
      .from('users')
      .select('gold_staters, last_claim_time')
      .eq('telegram_id', tgId)
      .single()

    if (error) {
      console.error('Error fetching user data:', error)
    } else if (data) {
      setGoldStaters(data.gold_staters)
      setLastClaimTime(data.last_claim_time)
    } else {
      // New user, create a record
      const { error } = await supabase
        .from('users')
        .insert({ telegram_id: tgId, gold_staters: 0, last_claim_time: 0 })
      if (error) console.error('Error creating user:', error)
    }
  }, [])

  const updateUserData = useCallback(async () => {
    if (telegramId) {
      const { error } = await supabase
        .from('users')
        .update({ gold_staters: goldStaters, last_claim_time: lastClaimTime })
        .eq('telegram_id', telegramId)
      if (error) console.error('Error updating user data:', error)
    }
  }, [telegramId, goldStaters, lastClaimTime])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram) {
      window.Telegram.WebApp.ready()
      const tgId = window.Telegram.WebApp.initDataUnsafe?.user?.id
      if (tgId) {
        setTelegramId(tgId)
        fetchUserData(tgId)
      }
    }
  }, [fetchUserData])

  useEffect(() => {
    updateUserData()
  }, [goldStaters, lastClaimTime, updateUserData])

  const handleClaim = useCallback(() => {
    const currentTime = Date.now()
    if (currentTime - lastClaimTime >= 24 * 60 * 60 * 1000) {
      setGoldStaters(prevGoldStaters => prevGoldStaters + 5)
      setLastClaimTime(currentTime)
    } else {
      alert("You can only claim once every 24 hours!")
    }
  }, [lastClaimTime])

  const renderTabContent = () => {
    switch(activeTab) {
      case 'wallet':
        return (
          <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Wallet</h2>
            <p className="text-lg">Balance: {goldStaters} Gold Staters</p>
          </div>
        )
      case 'tasks':
        return (
          <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Daily Tasks</h2>
            <p className="text-lg">Claim your daily Gold Staters!</p>
            <button 
              onClick={handleClaim}
              className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Claim Reward
            </button>
          </div>
        )
      case 'referrals':
        return (
          <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Referrals</h2>
            <p className="text-lg">Invite friends to earn more Gold Staters!</p>
            {/* Add referral code or link here */}
          </div>
        )
      case 'profile':
        return (
          <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Profile</h2>
            <p className="text-lg">Telegram ID: {telegramId}</p>
            {/* Add more profile information here */}
          </div>
        )
      default:
        return (
          <div className="p-4 flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
            <div className="text-4xl font-bold mb-4">{goldStaters} Gold Staters</div>
            <button 
              onClick={handleClaim} 
              className="w-32 h-32 rounded-full bg-yellow-400 hover:bg-yellow-500 flex items-center justify-center text-4xl mb-4"
            >
              🪙
            </button>
            <div className="text-sm text-gray-500">Tap the coin to claim 5 Gold Staters daily!</div>
          </div>
        )
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4 fixed top-0 left-0 right-0 z-10">
        <h1 className="text-2xl font-bold">Gold Stater App</h1>
      </header>
      <main className="flex-grow overflow-y-auto mt-16 mb-16 p-4">
        {renderTabContent()}
      </main>
      <nav className="bg-gray-200 p-2 flex justify-around fixed bottom-0 left-0 right-0 z-10">
        {['dashboard', 'wallet', 'tasks', 'referrals', 'profile'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-2 py-1 text-xs sm:text-sm sm:px-4 sm:py-2 rounded-md ${
              activeTab === tab
                ? 'bg-blue-500 text-white'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>
    </div>
  )
}