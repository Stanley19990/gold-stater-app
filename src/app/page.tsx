'use client'

import { useState, useEffect } from 'react'
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
  const [activeSection, setActiveSection] = useState('dashboard')

  const [telegramId, setTelegramId] = useState<number | null>(null)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram) {
      window.Telegram.WebApp.ready()
      const tgId = window.Telegram.WebApp.initDataUnsafe?.user?.id
      setTelegramId(tgId!)
      if (tgId) {
        fetchUserData(tgId)
      }
    }
  }, [])

  const fetchUserData = async (tgId: number) => {
    // ... function body
  }

  const init = async () => {

    const { data, error } = await supabase
    .from('users')
    .select('gold_staters, last_claim_time')
    .eq('telegram_id', telegramId)
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
        .insert({ telegram_id: telegramId, gold_staters: 0, last_claim_time: 0 })
      if (error) console.error('Error creating user:', error)
    }

  }

  init();

 const handleClaim = () => {
  // This fonction raise the claim feature

 }
  

  const updateUserData = async () => {
    if (telegramId) {
      const { error } = await supabase
        .from('users')
        .update({ gold_staters: goldStaters, last_claim_time: lastClaimTime })
        .eq('telegram_id', telegramId)
      if (error) console.error('Error updating user data:', error)
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram) {
      window.Telegram.WebApp.ready()
      const tgId = window.Telegram.WebApp.initDataUnsafe?.user?.id
      if (tgId) {
        setTelegramId(tgId)
        fetchUserData(tgId)
      }
    }
  }, [])

  const renderSection = () => {
    switch (activeSection) {
      case 'wallet':
        return <div>Wallet Balance: {goldStaters} Gold Staters</div>
      case 'tasks':
        return <div>Daily Task: Claim your Gold Staters!</div>
      case 'referrals':
        return <div>Invite friends to earn more Gold Staters!</div>
      case 'profile':
        return <div>Your Profile (Telegram ID: {telegramId})</div>
      default:
        return (
          <div className="flex flex-col items-center">
            <div className="text-2xl font-bold mb-4">{goldStaters} Gold Staters</div>
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
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-2xl font-bold">Gold Stater App</h1>
      </header>
      <main className="flex-grow p-4">
        {renderSection()}
      </main>
      <nav className="bg-gray-200 p-4 flex justify-around">
        <button onClick={() => setActiveSection('dashboard')}>Dashboard</button>
        <button onClick={() => setActiveSection('wallet')}>Wallet</button>
        <button onClick={() => setActiveSection('tasks')}>Tasks</button>
        <button onClick={() => setActiveSection('referrals')}>Referrals</button>
        <button onClick={() => setActiveSection('profile')}>Profile</button>
      </nav>
    </div>
  )
}