//apps\web\components\landing\home\Hero.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

export default function Hero() {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(true); // start muted (autoplay-safe)

    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            video.volume = 0.08; // very low volume
            video.muted = true; // start muted to allow autoplay
            video
                .play()
                .then(() => setIsPlaying(true))
                .catch(() => setIsPlaying(false)); // handle autoplay block gracefully
        }
    }, []);

    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;

        if (video.paused) {
            video.play();
            setIsPlaying(true);
        } else {
            video.pause();
            setIsPlaying(false);
        }
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;

        video.muted = !video.muted;
        setIsMuted(video.muted);
    };

    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center text-center text-white bg-black overflow-hidden mt-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.35),transparent_60%)] blur-3xl pointer-events-none"></div>

            <div className="max-w-4xl mx-auto px-6 pt-20 relative z-10 space-y-10">
                {/* Hero Heading */}
                <h1 className="text-6xl md:text-8xl font-extrabold leading-tight mb-3">
                    Your AI Crew
                </h1>

                {/* Subtext */}
                <p className="text-lg text-gray-400 max-w-2xl mt-0">
                    Boost productivity, eliminate manual work, and scale faster — powered by cutting-edge AI automation.
                </p>

                {/* Video with Custom Controls */}
                <div className="relative rounded-2xl overflow-hidden border border-zinc-800 shadow-[0_0_25px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] transition-all duration-500 mx-auto backdrop-blur-md">
                    <video
                        ref={videoRef}
                        className="w-full h-[350px] md:h-[480px]"
                        src="./Final.mp4"
                        autoPlay
                        loop
                        playsInline
                        muted // ✅ must stay muted for autoplay to work
                    />

                    {/* Custom Controls — Always Visible */}
                    <div className="absolute bottom-5 left-0 right-0 flex justify-center items-center gap-5">
                        {/* Play / Pause Button */}
                        <button
                            onClick={togglePlay}
                            className="p-3 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-lg border border-white/20 transition shadow-lg"
                        >
                            {isPlaying ? (
                                <Pause className="w-6 h-6 text-white" />
                            ) : (
                                <Play className="w-6 h-6 text-white" />
                            )}
                        </button>

                        {/* Mute / Unmute Button */}
                        <button
                            onClick={toggleMute}
                            className="p-3 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-lg border border-white/20 transition shadow-lg"
                        >
                            {isMuted ? (
                                <VolumeX className="w-6 h-6 text-white" />
                            ) : (
                                <Volume2 className="w-6 h-6 text-white" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}//test4
