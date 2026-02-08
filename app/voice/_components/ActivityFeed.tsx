
import React from 'react';
import { motion } from 'framer-motion';
// import { Message, ActivityLog } from '../types';
import { ChatBubble } from './ChatBubble';

export const ActivityFeed: React.FC<any> = ({ messages, activities }) => {
    console.log("messages", messages);

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
