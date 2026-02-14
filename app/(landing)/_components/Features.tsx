'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/app/lib/animations';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  delay: number;
}

<<<<<<< HEAD
const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <motion.div
    //@ts-expect-error
=======
const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay }) => (
  <motion.div 
>>>>>>> 87076760e5c67afb625c31045bf06a96ac419773
    variants={fadeInUp}
    whileHover={{ y: -5 }}
    className="group relative flex flex-col p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-brand-primary/10 h-full"
  >
    {/* Glow Gradient Blob */}
    <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-primary/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
    <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

    {/* Content */}
    <div className="relative z-10">
      <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white mb-6 group-hover:scale-110 group-hover:bg-brand-primary/20 group-hover:border-brand-primary/20 transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.2)] group-hover:shadow-[0_0_20px_rgba(19,19,236,0.3)]">
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>

      <h3 className="text-xl md:text-2xl font-bold text-white mb-3 font-display tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all duration-300">
        {title}
      </h3>
      
      <p className="text-gray-400 text-sm md:text-base leading-relaxed font-display group-hover:text-gray-300 transition-colors duration-300">
        {description}
      </p>
    </div>
  </motion.div>
);

const Features: React.FC = () => {
  const features = [
    {
      icon: "shopping_bag",
      title: "Order on Quick Commerce",
      description: "Connect your Zepto account, tell Paxio what you want, review the order and securely confirm the payment via UPI at the end. Blinkit, Zomato, Swiggy, and more coming soon. "
    },
    {
      icon: "integration_instructions",
      title: "Connect Your Favourite Tools",
      description: "Connect Gmail, Calendar, and Notion to Paxio and let it handle emails scheduling, and notes in the background, so you can stay focused on high intensity work without breaking flow."
    },
    {
      icon: "smart_toy",
      title: "Autonomous Workflows",
      description: "Schedule intelligent workflows to run at specific times or recurring intervals. Paxio can search the internet, take actions, and integrate seamlessly with Gmail, Calendar, and Notion automatically, on your behalf."
    }
  ];

  return (
    <section className="w-full max-w-7xl px-4 mb-24 scroll-mt-28 relative" id="features">
       {/* Background ambient glow */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-primary/10 blur-[100px] rounded-full pointer-events-none z-0"></div>

      <div className="flex flex-col items-center text-center gap-4 mb-16 relative z-10">
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white font-display tracking-tight mb-4">
            Core Features
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto font-display leading-relaxed">
            Why is Paxio Better than the rest ?
          </p>
        </motion.div>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10"
      >
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            delay={index * 0.1}
          />
        ))}
      </motion.div>
    </section>
  );
};

export default Features;
