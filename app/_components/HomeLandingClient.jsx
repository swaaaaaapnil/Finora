"use client";

import StatCard from "@/components/StatCard";
import FeatureCard from "@/components/FeatureCard";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function HomeLandingClient({ statsData, featuresData, howItWorksData, testimonialsData }) {
  return (
    <div>
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 justify-center items-center">
            {statsData.map((item, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-center h-40 min-w-[180px] rounded-2xl shadow-xl transition-transform duration-200 hover:scale-105"
                style={{ background: "rgba(196, 196, 196, 1)" }}
              >
                <div className="text-3xl sm:text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  {item.value}
                </div>
                <div className="text-base sm:text-lg font-medium text-gray-900 text-center">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-white text-3xl font-bold text-center mb-12">
            Everything you need to manage your finances
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center items-stretch">
            {featuresData.map((feature, index) => (
              <div key={index} className="h-full flex">
                <FeatureCard feature={feature} index={index} className="flex-1 p-6 rounded-xl  shadow-lg flex flex-col items-center" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-white text-3xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 justify-center items-stretch">
            {howItWorksData.map((step, index) => (
              <div
                key={index}
                style={{ background: "rgba(196, 196, 196, 1)" }}
                className="bg-gray-400 rounded-xl p-8 flex flex-col items-center shadow-lg border border-white/20 h-full"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold text-blue-600 text-center mb-4">{step.title}</h3>
                <p className="text-black text-center">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-white text-3xl font-bold text-center mb-16">What Our Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-center items-stretch">
            {testimonialsData.map((testimonial, index) => (
              <div
                key={index}
                className="rounded-xl p-8 flex flex-col items-center shadow-lg border border-white/20 h-full"
                style={{ background: "rgba(196, 196, 196, 1)" }}
              >
                <div className="flex items-center mb-4">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div className="ml-4 text-left">
                    <div className="font-semibold text-blue-600">{testimonial.name}</div>
                    <div className="text-sm text-black">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-black text-center">{testimonial.quote}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
