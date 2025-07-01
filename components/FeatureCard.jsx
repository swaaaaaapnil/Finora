"use client";
import { useRef, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function FeatureCard({ feature, index }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new window.IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Card
      ref={ref}
      className="rounded-xl p-6 flex flex-col items-center shadow-lg border border-gray-700 transition-all duration-700 opacity-100 translate-y-0"
      style={{ background: "rgba(196, 196, 196, 1)" }}
    >
      <CardContent className="space-y-4 pt-4 flex flex-col items-center">
        <div className="text-4xl mb-2">{feature.icon}</div>
        <h3 className="text-xl font-semibold text-blue-600 text-center">
          {feature.title}
        </h3>
        <p className="text-black text-center">{feature.description}</p>
      </CardContent>
    </Card>
  );
}
