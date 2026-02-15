
import React from 'react';
import { motion } from 'framer-motion';
import { User, Sparkles, Volume2 } from 'lucide-react';
import NewResponse from './responses/newResponse';

export const ChatBubble: React.FC<any> = ({ role, message, payload }) => {
    const isUser = role === 'user';

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
            >
                <div className={`flex max-w-[calc(100%-1rem)] sm:max-w-[85%] md:max-w-[70%] gap-2 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`flex-shrink-0 w-6 h-6 ${isUser ? 'sm:mr-10' : ''} sm:w-8 sm:h-8 rounded-full flex items-center justify-center border ${isUser ? 'bg-zinc-100 border-zinc-200 text-zinc-900' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
                        {isUser ? <User size={14} className="sm:w-4 sm:h-4" /> : <Sparkles size={14} className="sm:w-4 sm:h-4" />}
                    </div>

                    <div className="flex flex-col gap-1 min-w-0">
                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${isUser
                            ? 'bg-zinc-100 text-zinc-900 rounded-tr-none'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-none'
                            }`}>

                            <p className="whitespace-pre-wrap break-words">{message}</p>
                        </div>
                        <span className={`text-[10px] text-zinc-600 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                            {isUser ? 'You' : 'Paxio'}
                        </span>
                    </div>
                </div>
            </motion.div>
            {role == "assistant" &&
                <NewResponse
                    state={"idle"}
                    data={payload}
                />
            }

        </>
    );
};
