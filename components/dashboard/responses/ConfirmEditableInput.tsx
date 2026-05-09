import React from "react";
import { Check } from "lucide-react";

interface ConfirmEditableInputProps {
    label: string;
    value: string;
    onChange: (val: string) => void;
    onConfirm?: () => void;
}

const ConfirmEditableInput = ({
    label,
    value,
    onChange,
    onConfirm,
}: ConfirmEditableInputProps) => {
    const canSend = value.trim().length > 0;

    return (
        <div
            className="w-full max-w-3xl mx-auto
                       rounded-full px-6 py-4
                       bg-zinc-900/70 backdrop-blur
                       border border-zinc-800
                       flex items-center gap-4"
        >
            {/* Text section */}
            <div className="flex flex-col flex-1">
                <span className="text-[11px] text-zinc-500 tracking-wide mb-1">
                    {label}
                </span>

                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="bg-transparent outline-none
                               text-zinc-100 text-base font-normal
                               placeholder:text-zinc-600"
                />
            </div>

            {/* Tick Button */}
            <button
                onClick={onConfirm}
                disabled={!canSend}
                className={`
                    flex items-center justify-center
                    w-9 h-9 rounded-full
                    transition-all
                    ${canSend
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                        : "bg-zinc-800 text-zinc-500 cursor-not-allowed"}
                `}
            >
                <Check size={18} strokeWidth={2.5} />
            </button>
        </div>
    );
};

export default ConfirmEditableInput;



