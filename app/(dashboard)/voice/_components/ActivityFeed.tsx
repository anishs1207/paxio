
import React from 'react';
import { motion } from 'framer-motion';
// import { Message, ActivityLog } from '../types';
import { ChatBubble } from './ChatBubble';

// Skeleton component for chat bubbles
const ChatBubbleSkeleton: React.FC<{ isUser: boolean }> = ({ isUser }) => (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className={`flex max-w-[85%] md:max-w-[70%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar skeleton */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 animate-pulse`} />

            <div className="flex flex-col gap-1">
                {/* Message skeleton */}
                <div className={`px-4 py-3 rounded-2xl ${isUser ? 'rounded-tr-none' : 'rounded-tl-none'} bg-zinc-800 animate-pulse`}>
                    <div className="space-y-2">
                        <div className={`h-3 bg-zinc-700 rounded ${isUser ? 'w-32' : 'w-48'}`} />
                        <div className={`h-3 bg-zinc-700 rounded ${isUser ? 'w-24' : 'w-36'}`} />
                    </div>
                </div>
                {/* Label skeleton */}
                <div className={`h-2 w-12 bg-zinc-800 rounded animate-pulse ${isUser ? 'ml-auto' : ''}`} />
            </div>
        </div>
    </div>
);

export const ActivityFeed: React.FC<any> = ({ messages, activities, isLoading = false }) => {
    console.log("messages", messages);

    // Show skeleton loading
    if (isLoading) {
        return (
            <div className="space-y-4">
                <ChatBubbleSkeleton isUser={false} />
                <ChatBubbleSkeleton isUser={true} />
                <ChatBubbleSkeleton isUser={false} />
                <ChatBubbleSkeleton isUser={true} />
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {messages.map((message: any) => {
                return (
                    <ChatBubble
                        key={message.id}
                        conversationId={message.conversationId}
                        userId={message.userId}
                        role={message.role}
                        message={message.message}
                        payload={message.payload}
                    />
                )
            })}
        </div>
    );
};
