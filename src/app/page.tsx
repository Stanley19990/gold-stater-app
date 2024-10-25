'use client'

import { useState, useEffect } from 'react'

declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready: () => void;
        MainButton: {
          setText: (text: string) => void;
          show: () => void;
          onClick: (callback: () => void) => void;
        };
      };
    };
  }
}

export default function GoldStaterClicker() {
  const [goldStaters, setGoldStaters] = useState(0)
  const [lastClaimTime, setLastClaimTime] = useState(0)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram) {
      window.Telegram.WebApp.ready()
      window.Telegram.WebApp.MainButton.setText('Claim Gold Staters')
      window.Telegram.WebApp.MainButton.show()
      window.Telegram.WebApp.MainButton.onClick(handleClaim)
    }

    const savedGoldStaters = localStorage.getItem('goldStaters')
    const savedLastClaimTime = localStorage.getItem('lastClaimTime')
    if (savedGoldStaters) setGoldStaters(parseInt(savedGoldStaters))
    if (savedLastClaimTime) setLastClaimTime(parseInt(savedLastClaimTime))
  }, [])

  useEffect(() => {
    localStorage.setItem('goldStaters', goldStaters.toString())
    localStorage.setItem('lastClaimTime', lastClaimTime.toString())
  }, [goldStaters, lastClaimTime])

  const handleClaim = () => {
    const currentTime = Date.now()
    if (currentTime - lastClaimTime >= 24 * 60 * 60 * 1000) {
      setGoldStaters(prevGoldStaters => prevGoldStaters + 5)
      setLastClaimTime(currentTime)
    } else {
      alert("You can only claim once every 24 hours!")
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="text-4xl font-bold mb-8">{goldStaters} Gold Staters</div>
      <div className="w-32 h-32 rounded-full bg-yellow-400 flex items-center justify-center text-4xl">
        🪙
      </div>
      <div className="mt-4 text-sm text-gray-500">Use the Telegram button to claim 5 Gold Staters daily!</div>
    </div>
  )
}