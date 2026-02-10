'use client';
import React from 'react';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="group relative flex flex-col justify-between p-8 rounded-3xl bg-[#0a0a0a] border border-[#1a1a1a] hover:border-[#333] transition-colors duration-300 h-80 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

    <div className="relative z-10 w-12 h-12 flex items-center justify-center rounded-full bg-[#1a1a1a] text-white mb-6 group-hover:bg-white group-hover:text-black transition-colors duration-300">
      <span className="material-symbols-outlined">{icon}</span>
    </div>

    <div className="relative z-10 mt-auto">
      <h3 className="text-xl font-bold text-white mb-3 font-display">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed font-display">{description}</p>
    </div>
  </div>
);

const Features: React.FC = () => {
  const features = [
    {
      icon: "mic",
      title: "Zero-Latency Voice",
      description: "Real-time conversation with no delay. Talk to Paxio as naturally as you would a human."
    },
    {
      icon: "psychology",
      title: "Structured Memory",
      description: "Total recall of every interaction and data point. Paxio remembers context so you don't have to repeat yourself."
    },
    {
      icon: "currency_bitcoin",
      title: "Autonomous Commerce",
      description: "Agents that negotiate and purchase on your behalf. Secure, authenticated, and optimized for your preferences."
    }
  ];

  return (
    <section className="w-full max-w-7xl px-4 mb-24" id="features">
      <div className="flex flex-col items-center text-center gap-3 mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-white font-display">Core Capabilities</h2>
        <p className="text-gray-500 text-sm max-w-md font-display">Powered by neural architecture designed for zero-latency interaction.</p>
      </div>

      <div className="cursor-pointer grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </div>
    </section>
  );
};

export default Features;
