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
      title: "Order on Quick Commerce",
      description: "Connect your Zepto account, tell Paxio what you want, review the order and securely confirm the payment via UPI at the end. Blinkit, Zomato, Swiggy, and more coming soon. "
    },
    {
      icon: "psychology",
      title: "Connect Your Favourite Tools",
      description: "Connect Gmail, Calendar, and Notion to Paxio and let it handle emails scheduling, and notes in the background—so you can stay focused on high-intensity work without breaking flow."
    }
    ,
    {
      icon: "currency_bitcoin",
      title: "Autonomous Workflows",
      description: "Schedule intelligent workflows to run at specific times or recurring intervals. Paxio can search the internet, take actions, and integrate seamlessly with Gmail, Calendar, and Notion—automatically, on your behalf."
    }

  ];

  return (
    <section className="w-full max-w-7xl px-4 mb-10 scroll-mt-28" id="features">
      <div className="flex flex-col items-center text-center gap-3 mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-white font-display">Core Features</h2>
        <p className="text-gray-500 text-sm max-w-md font-display">Why is Paxio Better than the rest ? </p>
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
