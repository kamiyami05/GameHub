import React, { useState } from 'react';
import AnimatedBackground from '@/components/AnimatedBackground';
import Navbar from '@/components/Navbar';
import CaroGame from '@/components/CaroGame';
import CharacterSelectModal from '@/components/CharacterSelectModal';
import CoffeeModal from '@/components/CoffeeModal';

export default function App() {
  const [showCharModal, setShowCharModal] = useState(false);
  const [showCoffeeModal, setShowCoffeeModal] = useState(false);

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col items-center justify-between font-sans selection:bg-sky-500/30">
      {/* Calm Ambient Background */}
      <AnimatedBackground />

      {/* Main Container */}
      <div className="w-full max-w-6xl px-3 sm:px-6 py-3 sm:py-5 flex-1 flex flex-col">
        {/* Top Navbar */}
        <Navbar
          onOpenCharacterSelect={() => setShowCharModal(true)}
          onOpenCoffee={() => setShowCoffeeModal(true)}
        />

        {/* Dedicated Caro Game Arena */}
        <main className="flex-1 flex flex-col justify-center">
          <CaroGame
            onOpenCharacterSelect={() => setShowCharModal(true)}
          />
        </main>
      </div>

      {/* Character Selection Modal */}
      <CharacterSelectModal
        isOpen={showCharModal}
        onClose={() => setShowCharModal(false)}
      />

      {/* Coffee Donation Modal */}
      <CoffeeModal
        isOpen={showCoffeeModal}
        onClose={() => setShowCoffeeModal(false)}
      />
    </div>
  );
}
