"use client";
import { useRef, useEffect, useState } from "react";

export default function StatCard({ value, label, index }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={
        `rounded-xl p-6 flex flex-col items-center shadow-lg border border-white/20 transition-all duration-500 ` +
        (visible
          ? "animate-pop-in opacity-100 translate-y-0"
          : "opacity-0 translate-y-8")
      }
      style={{
        background: "rgba(196, 196, 196, 1)",
      }}
    >
      <div className="text-3xl md:text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 bg-clip-text text-transparent min-h-[2.5rem]">
        {value}
      </div>
      <div className="text-sm md:text-base text-black font-medium text-center">
        {label}
      </div>
    </div>
  );
}