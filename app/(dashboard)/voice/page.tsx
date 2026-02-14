"use client";

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Mail, Calendar, Share2, ShoppingBag, X } from "lucide-react";
import { Header, Footer } from "./_components/layout";
import { PeopleOverlay, ToolsOverlay } from "./_components/overlays";
import VoiceContent from "./_components/Container";
import IdleVisualizer from "./_components/responses/NeuralCoreSteup"
import { io, Socket } from "socket.io-client";
import { WorkflowFormBubble } from "./_components/Workflow"
import { DoomscrollSessions } from "./_components/DoomscrollSessions"
import OnboardingForm from "./_components/Onboarding";
import { useSession } from "next-auth/react";
import { generateSpeech } from "@/lib/actions";


type AppState = "idle" | "listening" | "thinking" | "speaking";
type MessageRole = "user" | "assistant";

interface Message {
    id: string;
    role: MessageRole;
    content: string;
    timestamp: Date;
    isVoice?: boolean;
}

interface ActivityLog {
    id: string;
    type: "tool" | "system" | "sync";
    description: string;
    timestamp: Date;
}

interface Person {
    id: string;
    name: string;
    email: string;
}

function decodePCM16(chunk: Uint8Array, audioContext: AudioContext) {
    const pcm16 = new Int16Array(
        chunk.buffer,
        chunk.byteOffset,
        chunk.byteLength / 2
    );

    const float32 = new Float32Array(pcm16.length);

    for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768;
    }

    const buffer = audioContext.createBuffer(
        1,
        float32.length,
        48000
    );

    buffer.copyToChannel(float32, 0);
    return buffer;
}



export default function VoicePage() {
    // Onboarding state: "loading" | "onboarding" | "ready"
    const [onboardingState, setOnboardingState] = useState<"loading" | "onboarding" | "ready">("loading");

    const [appState, setAppState] = useState<AppState>("idle");
    const [activeResponse, setActiveResponse] = useState("");
    const [inputText, setInputText] = useState("");
    const silenceCleanupRef = useRef<(() => void) | null>(null);
    const hasReceivedAudioRef = useRef(false);
    const { data: session, status: userStatus } = useSession();


    const userId = session?.user.id;

    const [credits, setCredits] = useState<number>(0);
    const [plan, setPlan] = useState<string>("FREE");
    const [isLoadingCredits, setIsLoadingCredits] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(true);

    const [showBriefing, setShowBriefing] = useState(true);
    const [showHistory, setShowHistory] = useState(true);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [isNexusOpen, setIsNexusOpen] = useState(false);

    const submittedPromptRef = useRef<string>("");

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const isAtBottomRef = useRef(true);

    const [showPeople, setShowPeople] = useState(false);
    const [response, setResponse] = useState(false);
    const [responsePayload, setResponsePayload] = useState(null);

    const [tools, setTools] = useState<any[]>([
        { name: "gmail", label: "Gmail", icon: <Mail size={22} />, status: "loading" },
        { name: "calendar", label: "Calendar", icon: <Calendar size={22} />, status: "loading" },
        // { name: "reddit", label: "Reddit", icon: <Share2 size={22} />, status: "loading" },
        { name: "notion", label: "Notion", icon: <Share2 size={22} />, status: "loading" },
        { name: "zepto", label: "Zepto", icon: <ShoppingBag size={22} />, status: "disconnected" },
    ]);


    const [conversationId, setConversationId] = useState("default")

    const shouldShowVisualizer = Boolean(responsePayload);
    const [isSocketReady, setIsSocketReady] = useState(false);

    const socketRef = useRef<Socket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceQueue = useRef<AudioBufferSourceNode[]>([]);
    const nextPlayTimeRef = useRef(0);

    const [message, setMessage] = useState<string | null>(null);
    const [status, setStatus] = useState<boolean>(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [socketId, setSocketId] = useState<string | null>(null);
    const [showWorkflow, setShowWorkflow] = useState(false);
    const [showSessions, setShowSessions] = useState(false);
    const [doomscrollUrl, setDoomscrollUrl] = useState<string | null>(null);
    const [showStopModal, setShowStopModal] = useState(false);

    const [messages, setMessages] = useState<any[]>([]);

    const [activities] = useState<any[]>([]);

    // Auto-vanish activeResponse after 5 seconds
    useEffect(() => {
        if (!activeResponse || appState === "listening" || appState === "speaking") return;

        const timer = setTimeout(() => {
            setActiveResponse("");
            // Optional: Reset to idle if we were in thinking state and text vanishes?
            // Usually we stay in 'thinking' until response comes. 
            // If response is done (text shows), we are usually in 'idle' or 'speaking'.
            // If 'speaking', we shouldn't vanish.
            // If 'idle', we can vanish.
        }, 5000);

        return () => clearTimeout(timer);
    }, [activeResponse, appState]);

    // Check onboarding status on mount
    useEffect(() => {
        if (userStatus !== "authenticated") return;
        axios
            .get("/api/onboarding-status", { headers: { userId: session?.user.id } })
            .then(({ data }) => {
                if (data.isOnboardingCompleted) {
                    setOnboardingState("ready");
                } else {
                    setOnboardingState("onboarding");
                }
            })
            .catch(() => {
                // If error, assume not onboarded
                setOnboardingState("onboarding");
            });
    }, [session?.user.id, userStatus]);

    useEffect(() => {
        setIsLoadingCredits(true);
        axios
            .get("/api/credits")
            .then(({ data }) => {
                setCredits(data.credits ?? 0);
                setPlan(data.plan ?? "FREE");
            })
            .catch(() => {
                setCredits(0);
                setPlan("FREE");
            })
            .finally(() => {
                setIsLoadingCredits(false);
            });
    }, []);

    useEffect(() => {
        axios
            .get("/api/status-tools", { headers: { userId } })
            .then(({ data }) =>
                setTools((prev) =>
                    prev.map((t) => ({
                        ...t,
                        status: data[t.name] ? "connected" : "disconnected",
                    }))
                )
            )
            .catch(() =>
                setTools((prev) => prev.map((t) => ({ ...t, status: "disconnected" })))
            );
    }, []);

    useEffect(() => {
        const socket = io("https://api.paxio.tech");
        // const socket = io("http://localhost:3000");
        socketRef.current = socket;
        audioContextRef.current = new AudioContext();

        socket.on("connect", async () => {
            console.log("Connected with id:", socket.id);
            console.log("VERSION: Transcription Feedback Fixed"); // Verify code update
            setSocketId(socket.id || null);
            console.log("socket is connected", socket.id)
            setIsSocketReady(true);

            if (audioContextRef.current?.state === "suspended") {
                await audioContextRef.current.resume();
            }

            nextPlayTimeRef.current = audioContextRef.current!.currentTime;
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected");
            setSocketId(null);
            setIsSocketReady(false);
        });

        socket.on("streamVoiceMessage", async ({ message, status, audioBuffer }) => {
            // Keep appState as "thinking" until we are ready to speak
            console.log("streamVoiceMessage received, processing audio...", message);

            // --- CARTESIA TTS IMPLEMENTATION ---
            if (message && !audioBuffer) {
                try {
                    console.log("Generating audio with Cartesia (Server Action) for:", message);
                    const result = await generateSpeech(message);

                    if (result.success && result.audio) {
                        const audioData = atob(result.audio);
                        const audioArray = new Uint8Array(audioData.length);
                        for (let i = 0; i < audioData.length; i++) {
                            audioArray[i] = audioData.charCodeAt(i);
                        }

                        if (audioContextRef.current) {
                            const finalBuffer = await audioContextRef.current.decodeAudioData(audioArray.buffer);
                            const source = audioContextRef.current.createBufferSource();
                            source.buffer = finalBuffer;
                            source.connect(audioContextRef.current.destination);

                            if (nextPlayTimeRef.current < audioContextRef.current.currentTime) {
                                nextPlayTimeRef.current = audioContextRef.current.currentTime;
                            }
                            source.start(nextPlayTimeRef.current);
                            nextPlayTimeRef.current += finalBuffer.duration;

                            setAppState("speaking");
                            setActiveResponse(message);
                        }
                    } else {
                        throw new Error(result.error || "Failed to generate audio");
                    }

                } catch (e) {
                    console.error("Cartesia TTS Error:", e);
                    // Fallback: Show text if audio fails
                    setAppState("speaking");
                    setActiveResponse(message);
                }
            } else if (audioBuffer && audioContextRef.current) {
                try {
                    const buffer = await audioContextRef.current.decodeAudioData(audioBuffer);
                    const source = audioContextRef.current.createBufferSource();
                    source.buffer = buffer;
                    source.connect(audioContextRef.current.destination);

                    if (nextPlayTimeRef.current < audioContextRef.current.currentTime) {
                        nextPlayTimeRef.current = audioContextRef.current.currentTime;
                    }
                    source.start(nextPlayTimeRef.current);
                    nextPlayTimeRef.current += buffer.duration;

                    // Sync: Show text and speak ONLY when audio starts
                    setAppState("speaking");
                    setActiveResponse(message);
                } catch (e) {
                    console.error("Error decoding streamed audio", e);
                    // Fallback
                    setAppState("speaking");
                    setActiveResponse(message);
                }
            }
        });

        // socket.on("audioStream", (chunk: ArrayBuffer) => {
        //     console.log("audioStream chunk received, size:", chunk.byteLength);
        //     if (!audioContextRef.current) return;

        //     try {
        //         const buffer = decodePCM16(
        //             new Uint8Array(chunk),
        //             audioContextRef.current
        //         );

        //         const source = audioContextRef.current.createBufferSource();
        //         source.buffer = buffer;
        //         source.connect(audioContextRef.current.destination);
        //         source.start(nextPlayTimeRef.current);
        //         nextPlayTimeRef.current += buffer.duration;
        //     } catch (err) {

        //         console.error("Error processing audio chunk:", err);
        //     }
        // });


        // socket.on("audioStreamEnd", () => {
        //     console.log("audioStreamEnd");
        //     // NOTE: Do NOT reset to idle here if we are expecting the main response.
        //     // We'll let the main response handling reset the state when IT finishes.
        // });


        socket.on("streamMessage", (data: any) => {
            console.log("Stream message received raw:", data);

            // Handle nested JSON in stepData or extraData (fallback)
            let processedData = data;
            const jsonString = data.stepData || data.extraData;

            if (jsonString && typeof jsonString === 'string') {
                try {
                    const parsed = JSON.parse(jsonString);
                    processedData = { ...data, ...parsed };
                } catch (e) {
                    console.error("Failed to parse JSON in streamMessage:", e);
                }
            }

            console.log("Processed stream message:", processedData);

            if (processedData.type === "doomscroll_start" && processedData.url) {
                console.log("Setting doomscroll URL:", processedData.url);
                setDoomscrollUrl(processedData.url);
                setResponsePayload(null); // Clear any previous visualizer payload
                setAppState("thinking");
                setActiveResponse("Researching...");
            } else if (processedData.type === "assistant_response") {
                console.log("Assistant response received, clearing doomscroll URL");
                setDoomscrollUrl(null);
                // User requested NOT to show the final text response in the main UI
                // setActiveResponse(processedData.message); 
                setAppState("speaking");
            } else if (processedData.type === "user_transcription") {
                console.log("User transcription received:", processedData.message);
                setActiveResponse(processedData.message);
                setAppState("thinking");
            }
        });

        return () => {
            socket.off("streamMessage");
            socket.disconnect();
            audioContextRef.current?.close();
        };
    }, []);

    useEffect(() => {
        if (socketId) console.log("Socket connected with id:", socketId);
    }, [socketId]);

    // Track scroll position to determine if we should auto-scroll
    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (scrollContainer) {
            const handleScroll = () => {
                const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
                const distanceToBottom = scrollHeight - scrollTop - clientHeight;
                isAtBottomRef.current = distanceToBottom < 100;
            };

            // Reset to true when the container re-appears (e.g. state change)
            isAtBottomRef.current = true;

            scrollContainer.addEventListener("scroll", handleScroll);
            return () => scrollContainer.removeEventListener("scroll", handleScroll);
        }
    }, [showHistory, appState, shouldShowVisualizer]);

    useEffect(() => {
        if (isAtBottomRef.current) {
            scrollRef.current?.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [messages, appState, showHistory, shouldShowVisualizer]);

    async function getAllMessages({
        userId,
        conversationId,
    }: any) {
        try {
            setIsLoadingMessages(true);
            const res = await axios.get<any[]>("/api/new-chat", {
                params: {
                    userId,
                    conversationId,
                },
            });
            console.log("getting messages")
            setMessages(prev => [...prev, ...res.data]);

        } catch (error: any) {
            console.error("getAllMessages failed:", error);

            throw (
                error?.response?.data ??
                new Error("Failed to fetch messages")
            );
        } finally {
            setIsLoadingMessages(false);
        }
    }

    const refreshCredits = async () => {
        try {
            const { data } = await axios.get("/api/credits");
            setCredits(data.credits ?? 0);
        } catch {
            setCredits(0);
        }
    };


    useEffect(() => {
        if (!userId) return;
        getAllMessages({ userId, conversationId });
    }, [userId, conversationId]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim()) return;

        const text = inputText.trim();
        submittedPromptRef.current = text;

        // 1. Optimistic Update (Show message immediately)
        setMessages((prev) => [
            ...prev,
            {
                id: Date.now().toString(), // Temporary ID
                role: "user",
                message: text, // ✅ FIXED: Changed 'content' to 'message'
                timestamp: new Date(),
            },
        ]);

        setInputText("");

        // 2. Call Backend
        await getResponse();
    };

    async function getResponse(audioBlob?: Blob) {
        try {
            setAppState("thinking");
            setActiveResponse("Processing...");

            const socketReady = socketRef.current?.connected;

            if (!socketReady) {
                setAppState("idle");
                setActiveResponse("Request failed.");
                return;
            }

            const formData = new FormData();

            if (audioBlob) {
                formData.append("audio", audioBlob, "voice.wav");
            }

            // --- HANDLER: USER MESSAGE ---
            if (submittedPromptRef.current) {
                formData.append("prompt", submittedPromptRef.current);
                try {
                    // 1. Capture the text strictly before the async call
                    const currentPrompt = submittedPromptRef.current;

                    axios.post("/api/new-chat", {
                        conversationId,
                        userId,
                        role: "user",
                        message: currentPrompt,
                        payload: {},
                    }).catch(err => console.error("Failed to save user message:", err));


                } catch (err) {
                    console.log(err);
                    return;
                }
            }

            if (!socketRef.current?.id) {
                setAppState("idle");
                return;
            }

            formData.append("socketId", socketRef.current?.id);
            submittedPromptRef.current = "";

            // --- CORE REQUEST ---
            const res = await axios.post(
                "/api/voice-personal-agent",
                formData,
                { responseType: "json" }
            );

            const { audio: audioBase64, data, transcription } = res.data;
            setResponsePayload(data);

            // --- HANDLER: VOICE USER MESSAGE (transcribed) ---
            if (audioBlob && transcription) {
                try {
                    axios.post("/api/new-chat", {
                        conversationId,
                        userId,
                        role: "user",
                        message: transcription,
                        payload: {},
                    }).catch(err => console.error("Failed to save transcription:", err));

                    setMessages((prev) => [
                        ...prev,
                        {
                            id: Date.now().toString(),
                            role: "user",
                            message: transcription,
                            timestamp: new Date(),
                        },
                    ]);
                } catch (err) {
                    console.log("Failed to save voice transcription:", err);
                }
            }

            // Play Audio Logic
            if (audioBase64) {
                const audioData = atob(audioBase64);
                const audioArray = new Uint8Array(audioData.length);
                for (let i = 0; i < audioData.length; i++) {
                    audioArray[i] = audioData.charCodeAt(i);
                }

                if (audioContextRef.current) {
                    // Decode the final audio into an internal buffer
                    const finalBuffer = await audioContextRef.current.decodeAudioData(audioArray.buffer);

                    const source = audioContextRef.current.createBufferSource();
                    source.buffer = finalBuffer;
                    source.connect(audioContextRef.current.destination);

                    // Schedule it AFTER the previous streaming audio
                    if (nextPlayTimeRef.current < audioContextRef.current.currentTime) {
                        nextPlayTimeRef.current = audioContextRef.current.currentTime;
                    }
                    source.start(nextPlayTimeRef.current);
                    nextPlayTimeRef.current += finalBuffer.duration;

                    setAppState("speaking");

                    // Attach clean-up only to this final source
                    source.onended = () => {
                        setAppState("idle");
                        setActiveResponse("");
                    };
                }
            } else {
                setAppState("idle");
                setActiveResponse("");
            }

            // --- HANDLER: ASSISTANT RESPONSE ---
            try {
                // 2. Capture the response text strictly
                const aiResponse = data.response;

                axios.post("/api/new-chat", {
                    conversationId,
                    userId,
                    role: "assistant",
                    message: aiResponse,
                    payload: data.data,
                }).then(() => refreshCredits()).catch(err => console.error("Failed to save assistant response:", err));

                setMessages((prev) => [
                    ...prev,
                    {
                        id: Date.now().toString(),
                        role: "assistant",
                        // FIX: Use aiResponse directly.
                        // FIX: Changed key from 'content' to 'message'
                        message: aiResponse,
                        timestamp: new Date(),
                        payload: data.data,
                    },
                ]);

                // User requested NOT to show final text in main UI
                // setActiveResponse(aiResponse); 

                await refreshCredits();
            } catch (err) {
                console.log(err);
                return;
            }
        } catch (err) {
            console.error(err);
            setAppState("idle");
            setActiveResponse("Request failed.");
        }
    }

    let mediaRecorder: MediaRecorder;
    // --- ADJUSTABLE PARAMETERS ---
    const SILENCE_THRESHOLD = 0.05; // 5% volume - safer than 30%
    const SILENCE_DURATION = 800;   // Wait 800ms of silence to stop (500ms is very short)
    const NO_SPEECH_TIMEOUT = 5000; // Stop if no speech detected for 5s

    const startVoice = async () => {
        if (appState !== "idle") return;

        if (audioContextRef.current?.state === "suspended") {
            await audioContextRef.current.resume();
        }

        submittedPromptRef.current = "";

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);

        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        // Standard data collection
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                audioChunksRef.current.push(e.data);
            }
        };

        recorder.onstop = async () => {
            silenceCleanupRef.current?.(); // cleanup silence detection loop
            silenceCleanupRef.current = null;
            hasReceivedAudioRef.current = false;

            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
            stream.getTracks().forEach((t) => t.stop());
            setAppState("thinking");
            await getResponse(audioBlob);
        };

        recorder.start();
        setAppState("listening");
        setActiveResponse("Listening...");

        // Start silence detection IMMEDIATELY
        // @ts-expect-error
        silenceCleanupRef.current = startSilenceDetection(stream);

        // Backup safety timeout (10s max)
        setTimeout(() => {
            if (mediaRecorderRef.current?.state === "recording") {
                stopVoice();
            }
        }, 10000);
    };

    const startSilenceDetection = (stream: MediaStream) => {
        const audioCtx = audioContextRef.current;
        if (!audioCtx) return;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const data = new Uint8Array(analyser.fftSize);

        let silenceStart: number | null = null;
        let speechStart: number | null = null;
        let hasSpoken = false;
        let cancelled = false;

        const startTime = Date.now();

        const check = () => {
            if (cancelled) return;

            analyser.getByteTimeDomainData(data);

            // Calculate RMS volume
            let sum = 0;
            for (let i = 0; i < data.length; i++) {
                const v = (data[i] - 128) / 128;
                sum += v * v;
            }
            const volume = Math.sqrt(sum / data.length);

            // Check if user has started speaking
            if (!hasSpoken && volume > SILENCE_THRESHOLD) {
                hasSpoken = true;
                speechStart = Date.now();
                // console.log("Speech started!");
            }

            // Logic:
            // 1. If volume > threshold, reset silence timer (user is speaking)
            // 2. If volume < threshold AND user has spoken, start silence timer
            // 3. If silence timer > limit, stop recording

            if (volume > SILENCE_THRESHOLD) {
                silenceStart = null; // Reset silence timer
            } else {
                // It is silent...
                if (hasSpoken) {
                    // ...and user has already spoken at least once
                    silenceStart ??= Date.now();

                    if (Date.now() - silenceStart > SILENCE_DURATION) {
                        cancelled = true;
                        stopVoice();
                        return;
                    }
                } else {
                    // User hasn't spoken yet. Check explicit timeout for "no speech"
                    if (Date.now() - startTime > NO_SPEECH_TIMEOUT) {
                        cancelled = true;
                        stopVoice();
                        return;
                    }
                }
            }

            requestAnimationFrame(check);
        };

        check();

        return () => {
            cancelled = true;
            source.disconnect();
            // analyser.disconnect(); // optional
        };
    };

    const stopVoice = () => {
        // Stop silence detection loop
        silenceCleanupRef.current?.();
        silenceCleanupRef.current = null;

        // Stop recorder
        const recorder = mediaRecorderRef.current;
        if (!recorder || recorder.state !== "recording") return;
        recorder.stop();
    };

    // Handler for when onboarding is completed
    const handleOnboardingComplete = () => {
        setOnboardingState("ready");
    };

    // Show blank black screen while checking onboarding status
    if (onboardingState === "loading") {
        return (
            <div className="h-screen w-screen bg-black" />
        );
    }

    // Show onboarding form if user hasn't completed onboarding
    if (onboardingState === "onboarding") {
        return (
            <OnboardingForm
                userId={userId || ""}
                onComplete={handleOnboardingComplete}
            />
        );
    }

    // Main content (onboardingState === "ready")
    return (
        <div className="relative flex h-screen bg-black text-zinc-100 overflow-hidden">
            <div className="flex-1 flex flex-col relative">
                <Header
                    showBriefing={showBriefing}
                    setShowBriefing={setShowBriefing}
                    showHistory={showHistory}
                    setShowHistory={setShowHistory}
                    setIsNexusOpen={setIsNexusOpen}
                    setIsWorkflowOpen={setShowWorkflow}
                    setIsSessionsOpen={setShowSessions}
                    credits={credits}
                    plan={plan}
                    isLoadingCredits={isLoadingCredits}
                    showPeople={showPeople}
                    setShowPeople={setShowPeople}
                />

                {shouldShowVisualizer && (
                    //@ts-expect-error
                    (responsePayload?.data?.gmail?.emails?.length > 0) ||
                    //@ts-expect-error
                    (responsePayload?.data?.calendar?.events?.length > 0) ||
                    //@ts-expect-error
                    (responsePayload?.data?.reddit?.subreddits?.length > 0) ||
                    //@ts-expect-error
                    (responsePayload?.data?.notion?.pages?.length > 0) ||
                    //@ts-expect-error
                    (responsePayload?.data?.graphs?.graph?.length > 0)
                ) ?
                    <IdleVisualizer
                        responsePayload={responsePayload}
                        setResponsePayload={setResponsePayload}
                        setResponse={setResponse}

                    /> :
                    doomscrollUrl ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
                            <div className="bg-red-500/90 text-white px-4 py-2 rounded-full text-sm font-bold animate-pulse shadow-lg flex items-center gap-2">
                                <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                                LIVE AGENT VIEW
                            </div>

                            <div className="w-full max-w-6xl h-[80vh] bg-black rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl relative">
                                {/* Block interactions */}
                                <div className="absolute inset-0 z-10 bg-transparent" />

                                <iframe
                                    src={doomscrollUrl}
                                    className="w-full h-full"
                                    allow="clipboard-read; clipboard-write"
                                />

                                {/* Close Button */}
                                <button
                                    onClick={() => setShowStopModal(true)}
                                    className="absolute top-4 right-4 z-50 bg-white hover:bg-zinc-200 text-black p-2 rounded-full shadow-xl transition-all hover:scale-105"
                                >
                                    <X size={24} />
                                </button>

                                {/* Confirmation Modal */}
                                {showStopModal && (
                                    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                                        <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-xl max-w-md w-full mx-4 shadow-2xl">
                                            <h3 className="text-xl font-bold mb-2">Stop viewing?</h3>
                                            <p className="text-zinc-400 mb-6"> The agent will continue researching in the background.</p>

                                            <div className="flex flex-col gap-3">
                                                <button
                                                    onClick={() => {
                                                        setDoomscrollUrl(null);
                                                        setShowStopModal(false);
                                                    }}
                                                    className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors"
                                                >
                                                    Continue in background
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        // TODO: implement actual stop signal to backend
                                                        setDoomscrollUrl(null);
                                                        setShowStopModal(false);
                                                        setAppState("idle");
                                                        setActiveResponse("Doomscrolling stopped.");
                                                    }}
                                                    className="w-full py-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/50 rounded-lg font-medium transition-colors"
                                                >
                                                    Stop Doomscrolling
                                                </button>
                                                <button
                                                    onClick={() => setShowStopModal(false)}
                                                    className="mt-2 text-zinc-500 hover:text-zinc-300 text-sm"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="mt-6 text-zinc-400 font-mono text-sm animate-pulse">
                                Paxio is researching your topic...
                            </div>
                        </div>
                    ) :
                        (
                            <>
                                <VoiceContent
                                    appState={appState}
                                    activeResponse={activeResponse}
                                    showHistory={showHistory}
                                    messages={messages}
                                    activities={activities}
                                    isLoadingMessages={isLoadingMessages}
                                    response={response}
                                    //@ts-expect-error
                                    scrollRef={scrollRef}
                                />
                                {
                                    appState === "idle" && (
                                        <Footer
                                            //@ts-expect-error
                                            disabled={!isSocketReady}
                                            appState={appState}
                                            isKeyboardVisible={isKeyboardVisible}
                                            setIsKeyboardVisible={setIsKeyboardVisible}
                                            inputText={inputText}
                                            setInputText={setInputText}
                                            handleSendMessage={handleSendMessage}
                                            startVoice={startVoice}
                                        />
                                    )
                                }
                            </>
                        )
                }

                {/* @@fix this stop button */}
                {appState === "listening" && (
                    <button
                        onClick={stopVoice}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-zinc-600 rounded-full"
                    >
                        Stop
                    </button>
                )}
            </div>

            <ToolsOverlay
                isOpen={isNexusOpen}
                onClose={() => setIsNexusOpen(false)}
                tools={tools}
                setTools={setTools}
                userId={userId || ""}
            />

            <PeopleOverlay
                isOpen={showPeople}
                onClose={() => setShowPeople(false)}
                userId={userId}
            />

            <WorkflowFormBubble
                isOpen={showWorkflow}
                onClose={() => setShowWorkflow(false)}
                userId={userId || ""}
            />

            <DoomscrollSessions
                isOpen={showSessions}
                onClose={() => setShowSessions(false)}
                userId={userId || ""}
            />

        </div>
    );
}

