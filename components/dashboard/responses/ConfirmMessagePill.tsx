import React from "react";
import { Check } from "lucide-react";

interface ConfirmMessagePillProps {
    label?: string;
    message: string;
    onConfirm?: () => void;
}

const ConfirmMessagePill = ({
    label = "Confirm",
    message,
    onConfirm,
}: ConfirmMessagePillProps) => {
    return (
        <div
            className="w-full max-w-3xl mx-auto
                       rounded-full px-6 py-4
                       bg-zinc-900/70 backdrop-blur
                       border border-zinc-800
                       flex items-center gap-4"
        >
            {/* Text */}
            <div className="flex flex-col flex-1">
                <span className="text-[11px] text-zinc-500 tracking-wide mb-1">
                    {label}
                </span>

                <p className="text-zinc-100 text-base font-normal">
                    {message}
                </p>
            </div>

            {/* Tick */}
            <button
                onClick={onConfirm}
                className="flex items-center justify-center
                           w-9 h-9 rounded-full
                           bg-emerald-600 hover:bg-emerald-500
                           transition-all text-white"
            >
                <Check size={18} strokeWidth={2.5} />
            </button>
        </div>
    );
};

export default ConfirmMessagePill;