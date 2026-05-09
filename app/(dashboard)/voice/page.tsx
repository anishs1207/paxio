"use client";

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Mail, Calendar, Share2, ShoppingBag, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { generateSpeech } from "@/lib/actions";
import { io, Socket } from "socket.io-client";
import { Header, Footer, PeopleOverlay, ToolsOverlay, VoiceContent, IdleVisualizer, WorkflowFormBubble, DoomscrollSessions, OnboardingForm } from "@/components/dashboard";

type AppState = "idle" | "listening" | "thinking" | "speaking";
type MessageRole = "user" | "assistant";

interface Message {
    id: string;
    role: MessageRole;
    message: string;
    timestamp: Date;
    isVoice?: boolean;
    payload?: unknown;
}

interface ActivityLog {
    id: string;
    type: "tool" | "system" | "sync";
    description: string;
    timestamp: Date;
}

interface Tool {
    name: string;
    label: string;
    icon: React.ReactNode;
    status: "loading" | "connected" | "disconnected";
}



export default function VoicePage() {
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

    const [tools, setTools] = useState<Tool[]>([
        { name: "gmail", label: "Gmail", icon: <Mail size={22} />, status: "loading" },
        { name: "calendar", label: "Calendar", icon: <Calendar size={22} />, status: "loading" },
        // { name: "reddit", label: "Reddit", icon: <Share2 size={22} />, status: "loading" },
        { name: "notion", label: "Notion", icon: <Share2 size={22} />, status: "loading" },
        { name: "zepto", label: "Zepto", icon: <ShoppingBag size={22} />, status: "disconnected" },
    ]);


    const [conversationId] = useState("default")

    const shouldShowVisualizer = Boolean(responsePayload);
    const [isSocketReady, setIsSocketReady] = useState(false);

    const socketRef = useRef<Socket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const nextPlayTimeRef = useRef(0);

    const [socketId, setSocketId] = useState<string | null>(null);
    const [showWorkflow, setShowWorkflow] = useState(false);
    const [showSessions, setShowSessions] = useState(false);
    const [doomscrollUrl, setDoomscrollUrl] = useState<string | null>(null);
    const [showStopModal, setShowStopModal] = useState(false);

    const [messages, setMessages] = useState<Message[]>([]);

    const [activities] = useState<ActivityLog[]>([]);

    useEffect(() => {
        if (!activeResponse || appState === "listening" || appState === "speaking") return;

        const timer = setTimeout(() => {
            setActiveResponse("");
        }, 5000);

        return () => clearTimeout(timer);
    }, [activeResponse, appState]);

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
    }, [userId]);

    useEffect(() => {
        const socket = io("https://api.paxio.tech");
        socketRef.current = socket;
        audioContextRef.current = new AudioContext();

        socket.on("connect", async () => {
            console.log("Connected with id:", socket.id);
            console.log("VERSION: Transcription Feedback Fixed");
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

        socket.on("streamVoiceMessage", async ({ message, audioBuffer }) => {
            console.log("streamVoiceMessage received, processing audio...", message);

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

                    setAppState("speaking");
                    setActiveResponse(message);
                } catch (e) {
                    console.error("Error decoding streamed audio", e);
                    setAppState("speaking");
                    setActiveResponse(message);
                }
            }
        });

        socket.on("streamMessage", (data: { stepData?: string; extraData?: string; type?: string; url?: string; message?: string }) => {
            console.log("Stream message received raw:", data);

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
                setResponsePayload(null);
                setAppState("thinking");
                setActiveResponse("Researching...");
            } else if (processedData.type === "assistant_response") {
                console.log("Assistant response received, clearing doomscroll URL");
                setDoomscrollUrl(null);
                setAppState("speaking");
            } else if (processedData.type === "user_transcription") {
                console.log("User transcription received:", processedData.message);
                // @ts-expect-error - message is dynamic from socket
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
    }: { userId: string; conversationId: string }) {
        try {
            setIsLoadingMessages(true);
            const res = await axios.get<unknown[]>("/api/new-chat", {
                params: {
                    userId,
                    conversationId,
                },
            });
            console.log("getting messages")
            setMessages(prev => [...prev, ...res.data as Message[]]);

        } catch (error: unknown) {
            console.error("getAllMessages failed:", error);

            throw (
                (error as { response?: { data?: unknown } })?.response?.data ??
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

        setMessages((prev) => [
            ...prev,
            {
                id: Date.now().toString(),
                role: "user",
                message: text,
                timestamp: new Date(),
            },
        ]);

        setInputText("");

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

            if (submittedPromptRef.current) {
                formData.append("prompt", submittedPromptRef.current);
                try {
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

            const res = await axios.post(
                "/api/voice-personal-agent",
                formData,
                { responseType: "json" }
            );

            const { audio: audioBase64, data, transcription } = res.data;
            setResponsePayload(data);

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

            if (audioBase64) {
                const audioData = atob(audioBase64);
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

                    source.onended = () => {
                        setAppState("idle");
                        setActiveResponse("");
                    };
                }
            } else {
                setAppState("idle");
                setActiveResponse("");
            }

            try {
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
                        message: aiResponse,
                        timestamp: new Date(),
                        payload: data.data,
                    },
                ]);

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



    const SILENCE_THRESHOLD = 0.05;
    const SILENCE_DURATION = 800;
    const NO_SPEECH_TIMEOUT = 5000;

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

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                audioChunksRef.current.push(e.data);
            }
        };

        recorder.onstop = async () => {
            silenceCleanupRef.current?.();
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

        silenceCleanupRef.current = startSilenceDetection(stream);

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
        let hasSpoken = false;
        let cancelled = false;

        const startTime = Date.now();

        const check = () => {
            if (cancelled) return;

            analyser.getByteTimeDomainData(data);

            let sum = 0;
            for (let i = 0; i < data.length; i++) {
                const v = (data[i] - 128) / 128;
                sum += v * v;
            }
            const volume = Math.sqrt(sum / data.length);

            if (!hasSpoken && volume > SILENCE_THRESHOLD) {
                hasSpoken = true;
            }

            if (volume > SILENCE_THRESHOLD) {
                silenceStart = null;
            } else {
                if (hasSpoken) {
                    silenceStart ??= Date.now();

                    if (Date.now() - silenceStart > SILENCE_DURATION) {
                        cancelled = true;
                        stopVoice();
                        return;
                    }
                } else {
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
        };
    };

    const stopVoice = () => {
        silenceCleanupRef.current?.();
        silenceCleanupRef.current = null;

        const recorder = mediaRecorderRef.current;
        if (!recorder || recorder.state !== "recording") return;
        recorder.stop();
    };

    const handleOnboardingComplete = () => {
        setOnboardingState("ready");
    };

    if (onboardingState === "loading") {
        return (
            <div className="h-screen w-screen bg-black" />
        );
    }

    if (onboardingState === "onboarding") {
        return (
            <OnboardingForm
                userId={userId || ""}
                onComplete={handleOnboardingComplete}
            />
        );
    }

    return (
        <div className="relative flex h-[100dvh] bg-black text-zinc-100 overflow-hidden w-full max-w-[100vw]">
            <div className="flex-1 flex flex-col relative w-full max-w-full overflow-x-hidden">
                <Header
                    showBriefing={showBriefing}
                    setShowBriefing={setShowBriefing}
                    showHistory={showHistory}
                    setShowHistory={setShowHistory}
                    setIsNexusOpen={(val) => { if (val) { setShowPeople(false); setShowWorkflow(false); setShowSessions(false); } setIsNexusOpen(val); }}
                    setIsWorkflowOpen={(val) => { if (val) { setIsNexusOpen(false); setShowPeople(false); setShowSessions(false); } setShowWorkflow(val); }}
                    setIsSessionsOpen={(val) => { if (val) { setIsNexusOpen(false); setShowPeople(false); setShowWorkflow(false); } setShowSessions(val); }}
                    credits={credits}
                    plan={plan}
                    isLoadingCredits={isLoadingCredits}
                    showPeople={showPeople}
                    setShowPeople={(val) => { if (val) { setIsNexusOpen(false); setShowWorkflow(false); setShowSessions(false); } setShowPeople(val); }}
                />

                {shouldShowVisualizer && (
                    // @ts-expect-error - nested payload structure is dynamic from assistant response
                    (responsePayload?.data?.gmail?.emails?.length > 0) ||
                    // @ts-expect-error - nested payload structure is dynamic from assistant response
                    (responsePayload?.data?.calendar?.events?.length > 0) ||
                    // @ts-expect-error - nested payload structure is dynamic from assistant response
                    (responsePayload?.data?.reddit?.subreddits?.length > 0) ||
                    // @ts-expect-error - nested payload structure is dynamic from assistant response
                    (responsePayload?.data?.notion?.pages?.length > 0) ||
                    // @ts-expect-error - nested payload structure is dynamic from assistant response
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
                                    //@ts-expect-error - scrollRef type mismatch with component internal ref expectation
                                    scrollRef={scrollRef}
                                />
                                {
                                    appState === "idle" && (
                                        <Footer
                                            // @ts-expect-error - Footer component disabled prop mismatch
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

