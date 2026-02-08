import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, Send, Keyboard } from "lucide-react";
import { useState, useEffect } from "react";
import personal from "@/assets/assistant-icons/personal.png";
import persona2 from "@/assets/assistant-icons/personal2.png";
import personal3 from "@/assets/assistant-icons/personal3.png";
import personal4 from "@/assets/assistant-icons/personal4.png";

import Image from "next/image";

const avatars = [personal, persona2, personal3, personal4];

interface ChatFooterProps {
    appState: "idle" | string;

    isKeyboardVisible: boolean;
    setIsKeyboardVisible: (value: boolean) => void;

    inputText: string;
    setInputText: (value: string) => void;

    handleSendMessage: (e: React.FormEvent) => void;
    startVoice: () => void;
}



const ChatFooter: React.FC<ChatFooterProps> = ({
    appState,
    isKeyboardVisible,
    setIsKeyboardVisible,
    inputText,
    setInputText,
    handleSendMessage,
    startVoice,
}) => {
      const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % avatars.length);
    }, 1000);

    return () => clearInterval(interval);
  }, []);
    const [gmail, setGmail] = useState("anishs1027@gmail");
    return (
        <footer
            className={`mb-3 w-full md:p-12 z-50 flex justify-center 
      bg-gradient-to-t from-black via-black/90 to-transparent 
      transition-all duration-500 ${appState !== "idle"
                    ? "opacity-0 translate-y-10"
                    : "opacity-100 translate-y-0"
                }`}
        >
            <div className="w-full pt-5 max-w-3xl flex flex-col gap-6">
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                    <AnimatePresence mode="wait">
                        {isKeyboardVisible ? (
                            <div className="flex items-center gap-1">
                            {/* <Image
                                    src={personal}
                                    alt="Personal assistant"
                                    width={80}
                                    height={80}
                                /> */}
                                  <Image
      src={avatars[index]}
      alt="Assistant avatar"
      width={80}
      height={80}
      className="rounded-full transition-opacity duration-500"
      priority
    />
                            
                            <motion.form
                                key="text-mode"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.02 }}
                                onSubmit={handleSendMessage}
                                className="flex-1 flex items-center gap-4 bg-zinc-900/30 border border-zinc-800/50 p-3 pl-8 rounded-[3rem] backdrop-blur-3xl shadow-2xl focus-within:border-zinc-700 transition-all"
                            >
                              

                                {/* add to show smaoel to confirm an email her and renderl */}
                                <input
                                    autoFocus
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-transparent border-none outline-none text-zinc-100 placeholder:text-zinc-700 text-lg font-light py-2"
                                />


                                <button
                                    type="button"
                                    onClick={() => setIsKeyboardVisible(false)}
                                    className="cursor-pointer p-3 text-zinc-600 hover:text-zinc-300"
                                >
                                    <Mic size={20} />
                                </button>

                                <button
                                    type="submit"
                                    disabled={!inputText.trim()}
                                    className="cursor-pointer w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-950 disabled:opacity-10 transition-all hover:scale-105 active:scale-95"
                                >
                                    <Send size={20} />
                                </button>
                            </motion.form>
                            </div>
                        ) : (
                            <motion.div
                                key="voice-mode"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex-1 flex items-center justify-center gap-10"
                            >
                                <button
                                    onClick={() => setIsKeyboardVisible(true)}
                                    className="cursor-pointer w-24 h-24 rounded-[2rem] bg-zinc-900/50 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-100 hover:border-zinc-700 transition-all"
                                >
                                    <Keyboard size={30} />
                                </button>

                                <button
                                    onClick={startVoice}
                                    className="cursor-pointer w-24 h-24 rounded-[2rem] bg-zinc-900/50 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-100 hover:border-zinc-700 transition-all"
                                >
                                    <Mic size={30} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </footer >
    );
};

export default ChatFooter;
