'use client';

import { useEffect, useState, useCallback } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

function generateParticles(count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.3 + 0.1,
    });
  }
  return particles;
}

export function AnimatedBackground() {
  const [particles, setParticles] = useState<Particle[]>([]);

  const updateParticles = useCallback(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const particleCount = isMobile ? 15 : 30;
    setParticles(generateParticles(particleCount));
  }, []);

  useEffect(() => {
    // Initial generation
    updateParticles();

    // Handle resize with debounce
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateParticles, 250);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [updateParticles]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e]/50 via-transparent to-[#0f3460]/50" />
      
      {/* Floating particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            background: `radial-gradient(circle, rgba(249,115,22,0.6) 0%, rgba(168,85,247,0.4) 100%)`,
            animation: `float ${particle.duration}s ease-in-out ${particle.delay}s infinite`,
            boxShadow: `0 0 ${particle.size * 2}px rgba(249,115,22,0.3)`,
          }}
        />
      ))}

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-10px) translateX(-10px);
          }
          75% {
            transform: translateY(-30px) translateX(5px);
          }
        }
      `}</style>
    </div>
  );
}
