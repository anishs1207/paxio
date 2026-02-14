'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/app/lib/animations';

const GmailIcon = () => (
  <svg className="inline-block w-4 h-4 mx-0.5 -mt-0.5" viewBox="52 42 88 66" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285f4" d="M58 108h14V74L52 59v43c0 3.32 2.69 6 6 6" />
    <path fill="#34a853" d="M120 108h14c3.32 0 6-2.69 6-6V59l-20 15" />
    <path fill="#fbbc04" d="M120 48v26l20-15v-8c0-7.42-8.47-11.65-14.4-7.2" />
    <path fill="#ea4335" d="M72 74V48l24 18 24-18v26L96 92" />
    <path fill="#c5221f" d="M52 51v8l20 15V48l-5.6-4.2c-5.94-4.45-14.4-.22-14.4 7.2" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="inline-block w-4 h-4 mx-0.5 -mt-0.5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 4h11.5c4.14 0 7.5 3.36 7.5 7.5V24H24V4z" />
    <path fill="#34A853" d="M24 24h19v11.5c0 4.14-3.36 7.5-7.5 7.5H24V24z" />
    <path fill="#FBBC04" d="M5 24h19v19H12.5c-4.14 0-7.5-3.36-7.5-7.5V24z" />
    <path fill="#4285F4" d="M12.5 4H24v20H5V11.5C5 7.36 8.36 4 12.5 4z" />
    <rect x="11" y="10" width="26" height="28" fill="#fff" />
    <text x="24" y="33" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="22" fill="#4285F4" textAnchor="middle">31</text>
  </svg>
);

const NotionIcon = () => (
  <svg className="inline-block w-4 h-4 mx-0.5 -mt-0.5" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.017 4.313l55.333 -4.087c6.797 -0.583 8.543 -0.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277 -1.553 6.807 -6.99 7.193L24.467 99.967c-4.08 0.193 -6.023 -0.39 -8.16 -3.113L3.3 79.94c-2.333 -3.113 -3.3 -5.443 -3.3 -8.167V11.113c0 -3.497 1.553 -6.413 6.017 -6.8z" fill="white" />
    <path d="M61.35 0.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v60.66c0 2.723 0.967 5.053 3.3 8.167l12.007 16.913c2.137 2.723 4.08 3.307 8.16 3.113l64.257 -3.89c5.433 -0.387 6.99 -2.917 6.99 -7.193V20.64c0 -2.21 -0.873 -2.847 -3.443 -4.733L74.167 3.143c-4.273 -3.107 -6.02 -3.5 -12.817 -2.917zM25.92 19.523c-5.247 0.353 -6.437 0.433 -9.417 -1.99L8.927 11.507c-0.77 -0.78 -0.383 -1.753 1.557 -1.947l53.193 -3.887c4.467 -0.39 6.793 1.167 8.54 2.527l9.123 6.61c0.39 0.197 1.36 1.36 0.193 1.36l-54.933 3.307 -0.68 0.047zM19.803 88.3V30.367c0 -2.53 0.777 -3.697 3.103 -3.893L86 22.78c2.14 -0.193 3.107 1.167 3.107 3.693v57.547c0 2.53 -0.39 4.67 -3.883 4.863l-60.377 3.5c-3.493 0.193 -5.043 -0.97 -5.043 -4.083zM71.867 34.5c0.387 1.75 0 3.5 -1.75 3.7l-2.917 0.577v42.773c-2.527 1.36 -4.853 2.137 -6.797 2.137 -3.107 0 -3.883 -0.973 -6.21 -3.887l-19.03 -29.94v28.967l6.02 1.363s0 3.5 -4.857 3.5l-13.39 0.777c-0.39 -0.78 0 -2.723 1.357 -3.11l3.497 -0.97v-38.3L21.1 39.727c-0.39 -1.75 0.58 -4.277 3.3 -4.473l14.367 -0.967 19.8 30.327v-26.83l-5.047 -0.58c-0.39 -2.143 1.163 -3.7 3.103 -3.89l13.243 -0.813z" fill="#000" />
  </svg>
);

const ZeptoIcon = () => (
  <svg className="inline-block w-4 h-4 mx-0.5 -mt-0.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#7B2D8E" />
    <text x="12" y="17" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="Arial, sans-serif">Z</text>
  </svg>
);

const BlinkitIcon = () => (
  <svg className="inline-block w-4 h-4 mx-0.5 -mt-0.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#F5C700" />
    <text x="12" y="17" textAnchor="middle" fill="#1A1A1A" fontSize="14" fontWeight="bold" fontFamily="Arial, sans-serif">B</text>
  </svg>
);

const ZomatoIcon = () => (
  <svg className="inline-block w-4 h-4 mx-0.5 -mt-0.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#E23744" />
    <text x="12" y="17" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="Arial, sans-serif">z</text>
  </svg>
);

const SwiggyIcon = () => (
  <svg className="inline-block w-4 h-4 mx-0.5 -mt-0.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#FC8019" />
    <text x="12" y="17" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="Arial, sans-serif">S</text>
  </svg>
);

interface FeatureCardProps {
  icon: string;
  title: string;
  description: React.ReactNode;
  delay: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay }) => (
  <motion.div
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
      description: (<>Connect your <ZeptoIcon /> Zepto account, tell Paxio what you want, review the order and securely confirm the payment via UPI at the end. <BlinkitIcon /> Blinkit, <ZomatoIcon /> Zomato, <SwiggyIcon /> Swiggy, and more coming soon.</>)
    },
    {
      icon: "integration_instructions",
      title: "Connect Your Favourite Tools",
      description: (<>Connect <GmailIcon /> Gmail, <CalendarIcon /> Calendar, and <NotionIcon /> Notion to Paxio and let it handle emails scheduling, and notes in the background, so you can stay focused on high intensity work without breaking flow.</>)
    },
    {
      icon: "smart_toy",
      title: "Autonomous Workflows",
      description: (<>Schedule intelligent workflows to run at specific times or recurring intervals. Paxio can search the internet, take actions, and integrate seamlessly with <GmailIcon /> Gmail, <CalendarIcon /> Calendar, and <NotionIcon /> Notion automatically, on your behalf.</>)
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
