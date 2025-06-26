"use client";

import { useState, useEffect } from "react";

function getTimeLeft(targetDate: string) {
  const total = Date.parse(targetDate) - Date.now();
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  return { total, days, hours, minutes, seconds };
}

export default function Countdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setTimeLeft(getTimeLeft(targetDate));
    
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [targetDate]);

  // Show loading state on server-side to prevent hydration mismatch
  if (!isClient) {
    return (
      <div className="flex justify-center space-x-4 text-center mt-2 mb-6">
        <div>
          <div className="text-3xl sm:text-4xl font-bold text-white">--</div>
          <div className="text-xs uppercase text-gray-200">Days</div>
        </div>
        <div>
          <div className="text-3xl sm:text-4xl font-bold text-white">--</div>
          <div className="text-xs uppercase text-gray-200">Hours</div>
        </div>
        <div>
          <div className="text-3xl sm:text-4xl font-bold text-white">--</div>
          <div className="text-xs uppercase text-gray-200">Minutes</div>
        </div>
        <div>
          <div className="text-3xl sm:text-4xl font-bold text-white">--</div>
          <div className="text-xs uppercase text-gray-200">Seconds</div>
        </div>
      </div>
    );
  }

  if (timeLeft.total <= 0) {
    return <span className="text-lg font-semibold text-green-300">Event Started!</span>;
  }

  return (
    <div className="flex justify-center space-x-4 text-center mt-2 mb-6">
      <div>
        <div className="text-3xl sm:text-4xl font-bold text-white">{timeLeft.days}</div>
        <div className="text-xs uppercase text-gray-200">Days</div>
      </div>
      <div>
        <div className="text-3xl sm:text-4xl font-bold text-white">{timeLeft.hours}</div>
        <div className="text-xs uppercase text-gray-200">Hours</div>
      </div>
      <div>
        <div className="text-3xl sm:text-4xl font-bold text-white">{timeLeft.minutes}</div>
        <div className="text-xs uppercase text-gray-200">Minutes</div>
      </div>
      <div>
        <div className="text-3xl sm:text-4xl font-bold text-white">{timeLeft.seconds}</div>
        <div className="text-xs uppercase text-gray-200">Seconds</div>
      </div>
    </div>
  );
} 