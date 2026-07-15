import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Sliders, Sparkles, RefreshCw, Zap } from 'lucide-react';

/**
 * Reusable AnimatedOrb Component
 * Contains all the premium organic physics motion, blur, glow, rotation, and GPU scaling.
 */
const AnimatedOrb = ({
  isPlaying = true,
  speed = 1,
  glowIntensity = 1,
  blurAmount = 40,
  orbSize = 250,
}) => {
  // Base durations for modular speed division
  const floatXDuration = 14 / speed;
  const floatYDuration = 11 / speed;
  const scaleDuration = 7 / speed;
  const rotateDuration = 25 / speed;

  // Custom radial gradient with dynamic glow intensities
  const gradientBackground = `radial-gradient(circle, 
    rgba(56, 189, 248, 1) 0%, 
    rgba(14, 165, 233, 0.7) 30%, 
    rgba(2, 132, 199, 0.3) 60%, 
    rgba(3, 105, 161, 0) 100%)`;

  const glowShadowStyle = {
    filter: `blur(${blurAmount}px)`,
    background: gradientBackground,
    boxShadow: `
      0 0 ${glowIntensity * 50}px rgba(56, 189, 248, ${0.45 * glowIntensity}),
      0 0 ${glowIntensity * 90}px rgba(14, 165, 233, ${0.25 * glowIntensity}),
      inset 0 0 ${glowIntensity * 30}px rgba(224, 242, 254, ${0.5 * glowIntensity})
    `,
    width: `${orbSize}px`,
    height: `${orbSize}px`,
    transition: 'width 0.2s ease-out, height 0.2s ease-out, filter 0.2s ease-out, box-shadow 0.2s ease-out',
  };

  return (
    <div className="relative flex items-center justify-center" style={{ width: orbSize + 150, height: orbSize + 150 }}>
      
      {/* 1. Main Core Orb with GPU-accelerated motion */}
      <motion.div
        style={glowShadowStyle}
        className="rounded-full relative z-10 will-change-transform"
        animate={
          isPlaying
            ? {
                x: [0, 35, -25, 20, -35, 0],
                y: [0, -45, 30, -20, 35, 0],
                scale: [1, 1.05, 0.96, 1.04, 0.97, 1],
                rotate: [0, 360],
              }
            : {}
        }
        transition={
          isPlaying
            ? {
                x: { duration: floatXDuration, repeat: Infinity, ease: 'easeInOut' },
                y: { duration: floatYDuration, repeat: Infinity, ease: 'easeInOut' },
                scale: { duration: scaleDuration, repeat: Infinity, ease: 'easeInOut' },
                rotate: { duration: rotateDuration, repeat: Infinity, ease: 'linear' },
              }
            : { duration: 0.5 }
        }
      >
        {/* Subtle internal abstract overlay for organic texture/sheen */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 via-transparent to-white/5 mix-blend-overlay"></div>
        <div className="absolute inset-3 rounded-full border border-sky-400/20 blur-[1px]"></div>
      </motion.div>

      {/* 2. Secondary soft accent halos representing organic particle glow */}
      <AnimatePresence>
        {isPlaying && (
          <>
            {/* Inner halo */}
            <motion.div
              style={{
                width: orbSize * 1.3,
                height: orbSize * 1.3,
                filter: `blur(${blurAmount * 1.5}px)`,
              }}
              className="absolute rounded-full bg-sky-500/10 pointer-events-none z-0 will-change-transform"
              animate={{
                x: [0, -20, 25, -15, 0],
                y: [0, 25, -20, 15, 0],
                scale: [0.95, 1.05, 0.98, 1.02, 0.95],
              }}
              transition={{
                duration: floatXDuration * 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            
            {/* Outer large glow aura */}
            <motion.div
              style={{
                width: orbSize * 1.8,
                height: orbSize * 1.8,
                filter: `blur(${blurAmount * 2.2}px)`,
              }}
              className="absolute rounded-full bg-indigo-500/5 pointer-events-none z-0 will-change-transform"
              animate={{
                scale: [1.02, 0.95, 1.05, 0.97, 1.02],
              }}
              transition={{
                duration: scaleDuration * 1.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Main Standalone AnimationPreview Page Component
 */
const AnimationPreview = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1.0);
  const [glowIntensity, setGlowIntensity] = useState(1.2);
  const [blurAmount, setBlurAmount] = useState(50);
  const [orbSize, setOrbSize] = useState(240);

  // Hardcoded background particles configuration
  const backgroundParticles = [
    { id: 1, size: 4, x: '20%', y: '30%', delay: 0, duration: 6 },
    { id: 2, size: 6, x: '75%', y: '25%', delay: 1, duration: 8 },
    { id: 3, size: 3, x: '80%', y: '70%', delay: 3, duration: 7 },
    { id: 4, size: 5, x: '15%', y: '80%', delay: 2, duration: 9 },
    { id: 5, size: 8, x: '45%', y: '15%', delay: 4, duration: 11 },
    { id: 6, size: 4, x: '60%', y: '85%', delay: 0.5, duration: 6.5 },
  ];

  const resetSliders = () => {
    setSpeed(1.0);
    setGlowIntensity(1.2);
    setBlurAmount(50);
    setOrbSize(240);
  };

  return (
    <div className="relative min-h-screen bg-[#030712] overflow-hidden flex flex-col justify-between font-sans text-gray-200 selection:bg-sky-500/30">
      
      {/* Background overlay grid & gradient accents */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-950/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-950/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Floating secondary background particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {backgroundParticles.map((pt) => (
          <motion.div
            key={pt.id}
            style={{
              width: pt.size,
              height: pt.size,
              left: pt.x,
              top: pt.y,
              boxShadow: '0 0 10px rgba(56, 189, 248, 0.4)',
            }}
            className="absolute rounded-full bg-sky-400/40"
            animate={
              isPlaying
                ? {
                    y: [0, -25, 20, -20, 0],
                    x: [0, 15, -15, 10, 0],
                    opacity: [0.3, 0.7, 0.4, 0.8, 0.3],
                  }
                : {}
            }
            transition={
              isPlaying
                ? {
                    duration: pt.duration / (speed || 1),
                    delay: pt.delay,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
                : { duration: 0.5 }
            }
          />
        ))}
      </div>

      {/* 1. Header Bar */}
      <header className="relative z-20 w-full px-6 py-4 flex items-center justify-between border-b border-gray-900 bg-[#030712]/50 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Zap size={16} />
          </div>
          <span className="font-extrabold text-sm uppercase tracking-wider text-white">THECLASSMATE</span>
          <span className="text-[10px] text-sky-400 font-bold bg-sky-950/40 px-2 py-0.5 rounded-full border border-sky-900/30">ORB STUDIO</span>
        </div>
        
        <div className="text-[10px] text-gray-500 font-medium hidden sm:block">
          GPU Transforms Enabled &bull; 60 FPS Engine
        </div>
      </header>

      {/* 2. Main Centered Orb Viewport */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 relative z-10 py-6">
        
        <div className="text-center mb-6 max-w-sm pointer-events-none">
          <h1 className="text-base font-bold text-white tracking-tight flex items-center justify-center">
            <Sparkles size={14} className="text-sky-400 mr-1.5 animate-pulse" />
            Animated Physics Orb
          </h1>
          <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
            Floating organically using modular keyframes pathing and custom ease animations.
          </p>
        </div>

        {/* Floating Orb Container */}
        <AnimatedOrb
          isPlaying={isPlaying}
          speed={speed}
          glowIntensity={glowIntensity}
          blurAmount={blurAmount}
          orbSize={orbSize}
        />

      </main>

      {/* 3. Bottom Premium Floating Control Panel */}
      <footer className="relative z-20 w-full max-w-4xl mx-auto px-4 pb-8 pt-2">
        <div className="bg-gray-950/75 backdrop-blur-xl border border-gray-900 rounded-2xl p-6 shadow-2xl flex flex-col space-y-6">
          
          {/* Row 1: Action Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-900/60 pb-4">
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsPlaying(true)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all border ${
                  isPlaying
                    ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.35)]'
                    : 'bg-transparent text-gray-400 border-gray-800 hover:text-white hover:border-gray-700'
                }`}
              >
                <Play size={12} fill={isPlaying ? 'currentColor' : 'none'} />
                <span>Play Animation</span>
              </button>

              <button
                onClick={() => setIsPlaying(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all border ${
                  !isPlaying
                    ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.35)]'
                    : 'bg-transparent text-gray-400 border-gray-800 hover:text-white hover:border-gray-700'
                }`}
              >
                <Pause size={12} fill={!isPlaying ? 'currentColor' : 'none'} />
                <span>Pause Animation</span>
              </button>
            </div>

            <div className="flex items-center space-x-2.5">
              <div className="flex items-center space-x-1 text-[10px] text-gray-400 uppercase font-bold">
                <Sliders size={12} className="text-sky-400" />
                <span>Physics Parameters</span>
              </div>
              <button
                onClick={resetSliders}
                className="p-1.5 bg-gray-900 hover:bg-gray-850 border border-gray-800 hover:text-white rounded-lg text-gray-400 transition-colors cursor-pointer"
                title="Reset Sliders"
              >
                <RefreshCw size={12} />
              </button>
            </div>

          </div>

          {/* Row 2: Sliders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Speed Slider */}
            <div className="space-y-2 text-left">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-gray-400">
                <span>Speed Factor</span>
                <span className="text-sky-400 font-mono font-extrabold">{speed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full accent-sky-400 h-1 bg-gray-900 rounded-lg cursor-pointer appearance-none focus:outline-none"
              />
              <div className="flex justify-between text-[8px] font-bold text-gray-500">
                <span>0.1x (Slow)</span>
                <span>3.0x (Fast)</span>
              </div>
            </div>

            {/* Glow Intensity Slider */}
            <div className="space-y-2 text-left">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-gray-400">
                <span>Glow Intensity</span>
                <span className="text-sky-400 font-mono font-extrabold">{(glowIntensity * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.5"
                step="0.1"
                value={glowIntensity}
                onChange={(e) => setGlowIntensity(parseFloat(e.target.value))}
                className="w-full accent-sky-400 h-1 bg-gray-900 rounded-lg cursor-pointer appearance-none focus:outline-none"
              />
              <div className="flex justify-between text-[8px] font-bold text-gray-500">
                <span>20% (Dim)</span>
                <span>250% (Max)</span>
              </div>
            </div>

            {/* Blur Amount Slider */}
            <div className="space-y-2 text-left">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-gray-400">
                <span>Blur Diffusion</span>
                <span className="text-sky-400 font-mono font-extrabold">{blurAmount}px</span>
              </div>
              <input
                type="range"
                min="10"
                max="120"
                step="5"
                value={blurAmount}
                onChange={(e) => setBlurAmount(parseInt(e.target.value))}
                className="w-full accent-sky-400 h-1 bg-gray-900 rounded-lg cursor-pointer appearance-none focus:outline-none"
              />
              <div className="flex justify-between text-[8px] font-bold text-gray-500">
                <span>10px (Sharp)</span>
                <span>120px (Soft)</span>
              </div>
            </div>

            {/* Orb Size Slider */}
            <div className="space-y-2 text-left">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-gray-400">
                <span>Orb Diameter</span>
                <span className="text-sky-400 font-mono font-extrabold">{orbSize}px</span>
              </div>
              <input
                type="range"
                min="100"
                max="500"
                step="10"
                value={orbSize}
                onChange={(e) => setOrbSize(parseInt(e.target.value))}
                className="w-full accent-sky-400 h-1 bg-gray-900 rounded-lg cursor-pointer appearance-none focus:outline-none"
              />
              <div className="flex justify-between text-[8px] font-bold text-gray-500">
                <span>100px (Min)</span>
                <span>500px (Max)</span>
              </div>
            </div>

          </div>

        </div>
      </footer>

    </div>
  );
};

export default AnimationPreview;
