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
            username: string;
            first_name: string;
            last_name: string;
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
  const [telegramUsername, setTelegramUsername] = useState<string | null>(null)
  const [referrals, setReferrals] = useState<Array<{ id: number, username: string, dailyEarnings: number }>>([])
  const [dailyReferralEarnings, setDailyReferralEarnings] = useState(0)
  const [inviteLink, setInviteLink] = useState('')

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

  const fetchReferralData = useCallback(async () => {
    if (telegramId) {
      const { data, error } = await supabase
        .from('referrals')
        .select('id, username, daily_earnings')
        .eq('referrer_id', telegramId)

      if (error) {
        console.error('Error fetching referral data:', error)
      } else if (data) {
        setReferrals(data.map(r => ({
          id: r.id,
          username: r.username,
          dailyEarnings: r.daily_earnings
        })))
        setDailyReferralEarnings(data.reduce((sum, r) => sum + r.daily_earnings, 0))
      }
    }
  }, [telegramId])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram) {
      window.Telegram.WebApp.ready()
      const tgUser = window.Telegram.WebApp.initDataUnsafe?.user
      if (tgUser) {
        setTelegramId(tgUser.id)
        setTelegramUsername(tgUser.username || `${tgUser.first_name} ${tgUser.last_name}`)
        fetchUserData(tgUser.id)
        fetchReferralData()
        setInviteLink(`https://t.me/YourBotUsername?start=${tgUser.id}`)
      }
    }
  }, [fetchUserData, fetchReferralData])

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

  const claimReferralEarnings = useCallback(async () => {
    if (telegramId && dailyReferralEarnings > 0) {
      const { error } = await supabase
        .from('users')
        .update({ 
          gold_staters: goldStaters + dailyReferralEarnings,
          last_referral_claim: new Date().toISOString()
        })
        .eq('telegram_id', telegramId)

      if (error) {
        console.error('Error claiming referral earnings:', error)
      } else {
        setGoldStaters(prevStaters => prevStaters + dailyReferralEarnings)
        setDailyReferralEarnings(0)
        // Reset daily earnings for referrals
        await supabase
          .from('referrals')
          .update({ daily_earnings: 0 })
          .eq('referrer_id', telegramId)
      }
    }
  }, [telegramId, dailyReferralEarnings, goldStaters])

  const copyInviteLink = useCallback(() => {
    navigator.clipboard.writeText(inviteLink)
      .then(() => alert('Invite link copied to clipboard!'))
      .catch(err => console.error('Failed to copy invite link:', err))
  }, [inviteLink])

  const renderTabContent = () => {
    switch(activeTab) {
      case 'wallet':
        return (
          <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Wallet</h2>
            <div className="bg-yellow-100 p-6 rounded-lg shadow-md">
              <p className="text-3xl font-bold text-yellow-800 mb-2">
                {goldStaters.toFixed(2)} Gold Staters
              </p>
              <p className="text-sm text-yellow-700">
                Last claim: {new Date(lastClaimTime).toLocaleString()}
              </p>
            </div>
            <button 
              onClick={handleClaim}
              className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded"
            >
              Claim Daily Reward
            </button>
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
            <p className="text-lg mb-4">Earn 1.5% from buddies + 0.5% from their referrals.</p>
            
            <div className="bg-blue-100 p-4 rounded-lg mb-4 flex justify-between items-center">
              <span className="text-xl font-semibold">Daily Earnings: {dailyReferralEarnings.toFixed(2)} Coins</span>
              <button 
                onClick={claimReferralEarnings}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                disabled={dailyReferralEarnings === 0}
              >
                Claim
              </button>
            </div>

            <h3 className="text-xl font-semibold mb-2">Your Referrals:</h3>
            {referrals.length > 0 ? (
              <ul className="list-disc pl-5 mb-4">
                {referrals.map(referral => (
                  <li key={referral.id} className="mb-2">
                    {referral.username} - Daily Earnings: {referral.dailyEarnings.toFixed(2)} Coins
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-4">You have not referred anyone yet. Start inviting friends!</p>
            )}

            <div className="mt-8">
              <p className="text-sm mb-2">Your Unique Invite Link:</p>
              <div className="flex items-center">
                <input 
                  type="text" 
                  value={inviteLink} 
                  readOnly 
                  className="flex-grow p-2 border rounded-l-md"
                />
                <button
                  onClick={copyInviteLink}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r-md"
                >
                  Invide Fren
                </button>
              </div>
            </div>
          </div>
        )
      case 'profile':
        return (
          <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Profile</h2>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-lg mb-2">
                <span className="font-semibold">Telegram ID:</span> {telegramId}
              </p>
              <p className="text-lg">
                <span className="font-semibold">Username:</span> {telegramUsername || 'Not set'}
              </p>
            </div>
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