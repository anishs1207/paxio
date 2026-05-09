"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Save, Phone, MapPin, CreditCard } from "lucide-react";
import axios, { AxiosError } from "axios";

interface ZeptoFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

const ZeptoFormModal: React.FC<ZeptoFormModalProps> = ({
    isOpen,
    onClose,
    userId,
}) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        phoneNumber: "",
        address: "",
        upiId: "",
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get("/api/zepto", {
                headers: { userid: userId },
            });
            if (res.data?.data) {
                setFormData({
                    phoneNumber: res.data.data.phoneNumber || "",
                    address: res.data.data.address || "",
                    upiId: res.data.data.upiId || "",
                });
            }
        } catch (err) {
            console.error("Error fetching Zepto data:", err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Fetch existing data when modal opens
    useEffect(() => {
        if (isOpen && userId) {
            fetchData();
        }
    }, [isOpen, userId, fetchData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            await axios.post("/api/zepto", {
                userId,
                ...formData,
            });
            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
            }, 1500);
        } catch (err: unknown) {
            console.error("Error saving Zepto data:", err);
            const axiosError = err as AxiosError<{ error?: string }>;
            setError(axiosError.response?.data?.error || "Failed to save details");
        } finally {
            setSaving(false);
        }
    };

    const isFormValid = formData.phoneNumber && formData.address && formData.upiId;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* BACKDROP */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
                    />

                    {/* MODAL */}
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="
                            fixed z-[60] inset-x-0 bottom-0
                            sm:inset-0 sm:flex sm:items-center sm:justify-center
                        "
                    >
                        <div
                            className="
                                w-full sm:max-w-md
                                bg-zinc-950 border border-zinc-800
                                rounded-t-3xl sm:rounded-3xl
                                shadow-2xl
                                p-6 sm:p-8
                                max-h-[90vh] overflow-y-auto
                            "
                        >
                            {/* HEADER */}
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
                                        <span className="text-white text-lg font-bold">Z</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-zinc-100">
                                            Zepto Settings
                                        </h2>
                                        <p className="text-sm text-zinc-500">
                                            Configure your delivery details
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="
                                        w-10 h-10 rounded-full
                                        bg-zinc-900 border border-zinc-800
                                        flex items-center justify-center
                                        text-zinc-400 hover:text-zinc-100
                                        transition
                                    "
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* FORM */}
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-4">
                                    <Loader2 className="animate-spin text-zinc-400" size={32} />
                                    <p className="text-zinc-500">Loading your details...</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* Phone Number */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                                            <Phone size={16} />
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={handleChange}
                                            placeholder="Enter your phone number"
                                            className="
                                                w-full px-4 py-3 rounded-xl
                                                bg-zinc-900 border border-zinc-800
                                                text-zinc-100 placeholder-zinc-600
                                                focus:outline-none focus:border-zinc-600
                                                transition
                                            "
                                        />
                                    </div>

                                    {/* Address */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                                            <MapPin size={16} />
                                            Delivery Address
                                        </label>
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            placeholder="Enter your full delivery address"
                                            rows={3}
                                            className="
                                                w-full px-4 py-3 rounded-xl
                                                bg-zinc-900 border border-zinc-800
                                                text-zinc-100 placeholder-zinc-600
                                                focus:outline-none focus:border-zinc-600
                                                transition resize-none
                                            "
                                        />
                                    </div>

                                    {/* UPI ID */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                                            <CreditCard size={16} />
                                            UPI ID
                                        </label>
                                        <input
                                            type="text"
                                            name="upiId"
                                            value={formData.upiId}
                                            onChange={handleChange}
                                            placeholder="yourname@upi"
                                            className="
                                                w-full px-4 py-3 rounded-xl
                                                bg-zinc-900 border border-zinc-800
                                                text-zinc-100 placeholder-zinc-600
                                                focus:outline-none focus:border-zinc-600
                                                transition
                                            "
                                        />
                                    </div>

                                    {/* Error Message */}
                                    {error && (
                                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                            {error}
                                        </div>
                                    )}

                                    {/* Success Message */}
                                    {success && (
                                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                                            Details saved successfully!
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={saving || !isFormValid}
                                        className={`
                                            w-full flex items-center justify-center gap-2
                                            px-5 py-3.5 rounded-xl
                                            text-sm font-semibold uppercase tracking-wider
                                            transition-all duration-200
                                            ${isFormValid && !saving
                                                ? "bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
                                                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                            }
                                        `}
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={18} />
                                                Save Details
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ZeptoFormModal;
