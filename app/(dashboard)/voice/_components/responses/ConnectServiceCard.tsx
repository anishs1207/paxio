"use client";

import React from "react";
import { MoveRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface ConnectServiceCardProps {
    service: string;
}

const ConnectServiceCard: React.FC<ConnectServiceCardProps> = ({ service }) => {
    const router = useRouter();

    const handleConnect = () => {
        router.push(`/api/connect/${service.toLowerCase()}`);
    };

    return (
        <div className="w-full max-w-md my-4 ml-2 p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl backdrop-blur-sm">
            <div className="flex flex-col items-start text-left space-y-4">
                <div className="p-3 bg-zinc-800 rounded-full">
                    <img 
                        src={`/icons/${service.toLowerCase()}.svg`} 
                        alt={service} 
                        className="w-8 h-8 opacity-80"
                        onError={(e) => {
                            // Fallback if icon doesn't exist
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                </div>
                
                <div className="space-y-2">
                    <h3 className="text-lg font-medium text-zinc-100">
                        Connect {service}
                    </h3>
                    <p className="text-sm text-zinc-400">
                        Connect your {service} account to access features like reading emails, managing calendar events, and more.
                    </p>
                </div>

                <button
                    onClick={handleConnect}
                    className="group flex items-center gap-2 px-6 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-full font-medium transition-all active:scale-95"
                >
                    Connect {service}
                    <MoveRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
};

export default ConnectServiceCard;
