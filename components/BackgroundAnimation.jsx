"use client";
import React, { useEffect } from "react";

const BackgroundAnimation = () => {
  useEffect(() => {
    function createParticles() {
      const particlesContainer = document.getElementById('particles');
      if (!particlesContainer) return;
      particlesContainer.innerHTML = '';
      const particleCount = 50;
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 4 + 2;
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        const delay = Math.random() * 6;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.animationDelay = delay + 's';
        particlesContainer.appendChild(particle);
      }
    }
    createParticles();
    window.addEventListener('resize', createParticles);
    return () => window.removeEventListener('resize', createParticles);
  }, []);

  return (
    <>
      <div className="grid-bg"></div>
      <div className="particles" id="particles"></div>
    </>
  );
};

export default BackgroundAnimation;