"use client";

import { Twitter, Linkedin } from "lucide-react";
import { motion } from "framer-motion";

import Link from "next/link";

const Footer = () => {
    const currentYear = new Date().getFullYear();

    const socialLinks = [
        { icon: Twitter, href: "https://x.com/anishs1207", label: "Twitter" },

        { icon: Linkedin, href: "https://www.linkedin.com/in/anish-sabharwal-a113a9307", label: "LinkedIn" },
        { icon: Twitter, href: "https://x.com/codewithrobu", label: "Twitter" },
        { icon: Linkedin, href: "https://www.linkedin.com/in/anushayjain/", label: "LinkedIn" },
    ];

    return (
        <footer className="w-full bg-black">
            <div className="mx-auto max-w-6xl px-6 py-16 flex flex-col items-center text-center gap-6">

                {/* Brand */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="space-y-3"
                >
                    <h2 className="text-4xl font-extrabold text-white">
                        Paxio
                    </h2>
                    <p className="text-zinc-400 text-sm max-w-md mx-auto">
                        Your AI Crew, coming soon...
                    </p>
                </motion.div>

                {/* Social Icons */}
                <motion.div
                    className="flex gap-4"
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    viewport={{ once: true }}
                >
                    {socialLinks.map((social, i) => (
                        <motion.a
                            key={i}
                            href={social.href}
                            aria-label={social.label}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition shadow-md"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <social.icon className="h-5 w-5" />
                        </motion.a>
                    ))}

                </motion.div>


                {/* Divider */}
                <div className="w-full border-t border-zinc-800 mt-10 pt-6" />

                <motion.p
                    className="text-zinc-500 text-sm"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                >
                    © {currentYear} Paxio. All rights reserved.
                </motion.p>

                {/* Legal Links */}
                <motion.div
                    className="flex flex-wrap justify-center gap-6"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                >
                    <Link href="/terms-of-service" className="text-zinc-500 hover:text-white transition-colors text-sm">
                        Terms of Service
                    </Link>
                    <Link href="/public-privacy-policy" className="text-zinc-500 hover:text-white transition-colors text-sm">
                        Privacy Policy
                    </Link>
                </motion.div>

                {/* Copyright */}

            </div>
        </footer>
    );
};

export default Footer;
