import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Lobby from '@/components/Lobby';
import CaroGame from '@/components/CaroGame';
import Game2048 from '@/components/Game2048';
import MinesweeperGame from '@/components/MinesweeperGame';
import AuthModal from '@/components/AuthModal';
import CoffeeModal from '@/components/CoffeeModal';
import AnimatedBackground from '@/components/AnimatedBackground';
import { useAuthStore } from '@/store/authStore';
import { audio } from '@/lib/audio';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('lobby'); // 'lobby' | 'caro' | '2048' | 'minesweeper'
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCoffeeOpen, setIsCoffeeOpen] = useState(false);

  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleNavigate = (screen) => {
    audio.playClick();
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const bgTheme = currentScreen === 'caro' 
    ? 'caro' 
    : currentScreen === '2048' 
      ? '2048' 
      : currentScreen === 'minesweeper' 
        ? 'minesweeper' 
        : 'lobby';

  return (
    <div className="w-full max-w-6xl min-h-screen flex flex-col items-center px-4 sm:px-6 lg:px-8 py-4 sm:py-6 mx-auto font-sans relative">
      {/* Dynamic Animated Ambient Background */}
      <AnimatedBackground theme={bgTheme} />

      {/* Top Header Navbar - ONLY SHOWN ON LOBBY (HOME) */}
      {currentScreen === 'lobby' && (
        <Navbar
          onNavigate={handleNavigate}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenCoffee={() => { audio.playClick(); setIsCoffeeOpen(true); }}
        />
      )}

      {/* Main View Content Area */}
      <main className="w-full flex-1 flex flex-col items-center justify-start">
        {currentScreen === 'lobby' && (
          <Lobby onSelectGame={handleNavigate} />
        )}

        {currentScreen === 'caro' && (
          <CaroGame onBack={() => handleNavigate('lobby')} />
        )}

        {currentScreen === '2048' && (
          <Game2048 onBack={() => handleNavigate('lobby')} />
        )}

        {currentScreen === 'minesweeper' && (
          <MinesweeperGame onBack={() => handleNavigate('lobby')} />
        )}
      </main>

      {/* Auth Modal (Google & Email) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Buy Me a Coffee Modal */}
      <CoffeeModal
        isOpen={isCoffeeOpen}
        onClose={() => setIsCoffeeOpen(false)}
      />
    </div>
  );
}
