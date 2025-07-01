"use client";
import React, { useRef, useEffect } from "react";

const ChartAnimation = () => {
  const chartRef = useRef(null);

  const restartAnimation = () => {
    if (!chartRef.current) return;
    const bars = chartRef.current.querySelectorAll('.bar');
    const trendPath = chartRef.current.querySelector('.trend-path');
    const arrow = chartRef.current.querySelector('.arrow');
    const dataPoints = chartRef.current.querySelectorAll('.data-point');

    bars.forEach(bar => {
      bar.style.animation = 'none';
      bar.offsetHeight;
      bar.style.animation = null;
    });

    if (trendPath) {
      trendPath.style.animation = 'none';
      trendPath.offsetHeight;
      trendPath.style.animation = null;
    }

    if (arrow) {
      arrow.style.animation = 'none';
      arrow.offsetHeight;
      arrow.style.animation = null;
    }

    dataPoints.forEach(point => {
      point.style.animation = 'none';
      point.offsetHeight;
      point.style.animation = null;
    });
  };

  useEffect(() => {
    const interval = setInterval(restartAnimation, 7000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="chart-wrapper" ref={chartRef}>
      <div className="chart">
        {/* Grid lines */}
        <div className="grid-lines">
          <div className="grid-line"></div>
          <div className="grid-line"></div>
          <div className="grid-line"></div>
          <div className="grid-line"></div>
          <div className="grid-line"></div>
        </div>
        {/* Animated bars */}
        <div className="bars-container">
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
        </div>
        {/* Animated trend line */}
        <div className="trend-line">
          <svg viewBox="0 0 300 100">
            <path className="trend-path" d="M10,80 Q80,60 150,40 T290,20"/>
          </svg>
        </div>
        {/* Data points */}
        <div className="data-points">
          <div className="data-point"></div>
          <div className="data-point"></div>
          <div className="data-point"></div>
          <div className="data-point"></div>
          <div className="data-point"></div>
        </div>
        {/* Animated arrow */}
        <div className="arrow">
          <svg viewBox="0 0 24 24">
            <path d="M7 14l5-5 5 5z"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default ChartAnimation;