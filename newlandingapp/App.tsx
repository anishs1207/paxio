import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import InterfacePreview from './components/InterfacePreview';
import Footer from './components/Footer';

const App: React.FC = () => {
  return (
    <div className="relative flex flex-col min-h-screen w-full bg-background-dark text-white font-display overflow-x-hidden antialiased selection:bg-white selection:text-black">
      <Navbar />
      
      <main className="flex-grow flex flex-col items-center justify-start pt-32 pb-20 px-4 md:px-8">
        <Hero />
        
        {/* Divider */}
        <div className="w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-[#333] to-transparent mb-24 opacity-50"></div>
        
        <Features />
        
        <InterfacePreview />
      </main>
      
      <Footer />
    </div>
  );
};

export default App;