'use client';

import React from 'react';
import { MagicBento } from './MagicBento';

export function MagicBentoDemo() {
  return (
    <div className="min-h-screen bg-[#0d0b11] flex items-center justify-center p-4 sm:p-8">
      <MagicBento
        textAutoHide={true}
        enableStars={true}
        enableSpotlight={true}
        enableBorderGlow={true}
        enableTilt={true}
        enableMagnetism={true}
        clickEffect={true}
        spotlightRadius={300}
        particleCount={12}
        glowColor="132, 0, 255"
      />
    </div>
  );
}

export default MagicBentoDemo;
