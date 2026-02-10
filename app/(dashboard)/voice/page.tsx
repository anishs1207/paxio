"use client";

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Mail, Calendar, Share2, ShoppingBag } from "lucide-react";
import { Header, Footer } from "./_components/layout";
import { PeopleOverlay, ToolsOverlay } from "./_components/overlays";
import VoiceContent from "./_components/Container";
import IdleVisualizer from "./_components/responses/NeuralCoreSteup"
import { io, Socket } from "socket.io-client";
import { WorkflowFormBubble } from "./_components/Workflow"
import { DoomscrollSessions } from "./_components/DoomscrollSessions"
import OnboardingForm from "./_components/Onboarding";
import { useSession } from "next-auth/react";


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

    const [messages, setMessages] = useState<any[]>([]);

    const [activities] = useState<any[]>([]);

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
        const socket = io("http://localhost:3002");
        socketRef.current = socket;
        audioContextRef.current = new AudioContext();

        socket.on("connect", async () => {
            console.log("Connected with id:", socket.id);
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
            setActiveResponse(message);
            console.log("streamVoiceMessage received:", message, status);
            setAppState("speaking");

            if (audioBuffer && audioContextRef.current) {
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
                } catch (e) {
                    console.error("Error decoding streamed audio", e);
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


        return () => {
            socket.disconnect();
            audioContextRef.current?.close();
        };
    }, []);

    useEffect(() => {
        if (socketId) console.log("Socket connected with id:", socketId);
    }, [socketId]);

    useEffect(() => {
        scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: "smooth",
        });
    }, [messages, appState, showHistory]);

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

                    const res = await axios.post("/api/new-chat", {
                        conversationId,
                        userId,
                        role: "user",
                        message: currentPrompt,
                        payload: {},
                    });


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
                    await axios.post("/api/new-chat", {
                        conversationId,
                        userId,
                        role: "user",
                        message: transcription,
                        payload: {},
                    });

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

                const dbRes = await axios.post("/api/new-chat", {
                    conversationId,
                    userId,
                    role: "assistant",
                    message: aiResponse,
                    payload: data.data,
                });

                setMessages((prev) => [
                    ...prev,
                    {
                        id: dbRes.data.id || Date.now().toString(),
                        role: "assistant",
                        // FIX: Use aiResponse directly.
                        // FIX: Changed key from 'content' to 'message'
                        message: aiResponse,
                        timestamp: new Date(),
                        payload: dbRes.data.payload || data.data,
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

    let mediaRecorder: MediaRecorder;
    let audioChunks: Blob[] = [];
    let silenceStart: number | null = null;

    const SILENCE_THRESHOLD = 0.01; // tweak
    const SILENCE_DURATION = 5000; // 5 sec


    // const startVoice = async () => {
    //     if (appState !== "idle") return;

    //     submittedPromptRef.current = "";

    //     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    //     const recorder = new MediaRecorder(stream);

    //     mediaRecorderRef.current = recorder;
    //     audioChunksRef.current = [];

    //     recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);

    //     recorder.onstop = async () => {
    //         const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
    //         stream.getTracks().forEach((t) => t.stop());
    //         await getResponse(audioBlob);
    //     };

    //     recorder.start();
    //     setAppState("listening");
    //     setActiveResponse("Listening...");

    //     setTimeout(() => {
    //         if (recorder.state === "recording") recorder.stop();
    //     }, 10000);
    // };

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

        // recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);

        recorder.ondataavailable = (e) => {
            audioChunksRef.current.push(e.data);

            if (!hasReceivedAudioRef.current) {
                hasReceivedAudioRef.current = true;
                // start silence detection and save cleanup
                //@ts-expect-error
                silenceCleanupRef.current = startSilenceDetection(stream);
            }
        };

        recorder.onstop = async () => {
            silenceCleanupRef.current?.(); // stop silence detection if still running
            silenceCleanupRef.current = null;
            hasReceivedAudioRef.current = false;

            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
            stream.getTracks().forEach((t) => t.stop());
            setAppState("thinking");
            await getResponse(audioBlob);
        };


        //         Your current implementation will start listening, detect silence, and stop automatically after ~5 seconds of silence.

        // The Stop button also works as a manual override.

        // You’re properly cleaning up the detection loop and recorder.

        setTimeout(() => {
            if (mediaRecorderRef.current?.state === "recording") {
                stopVoice();
            }
        }, 10000);



        // recorder.onstop = async () => {
        //     const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        //     stream.getTracks().forEach((t) => t.stop());
        //     setAppState("thinking");
        //     await getResponse(audioBlob);
        // };

        recorder.start();
        setAppState("listening");
        setActiveResponse("Listening...");

        // // start silence detection AFTER a short delay
        // setTimeout(() => {
        //     if (recorder.state === "recording") {
        //         silenceCleanupRef.current = startSilenceDetection(stream);
        //     }
        // }, 800);
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
        let cancelled = false;

        const check = () => {
            if (cancelled) return;

            analyser.getByteTimeDomainData(data);

            let sum = 0;
            for (let i = 0; i < data.length; i++) {
                const v = (data[i] - 128) / 128;
                sum += v * v;
            }

            const volume = Math.sqrt(sum / data.length);

            if (volume < 0.015) { // your threshold
                silenceStart ??= Date.now();

                if (Date.now() - silenceStart > 5000) { // 5 sec silence
                    cancelled = true; // stop loop
                    stopVoice();     // stop recorder
                    return;
                }
            } else {
                silenceStart = null;
            }

            requestAnimationFrame(check);
        };

        check();

        // return cleanup function
        return () => {
            cancelled = true;
        };
    };



    // const stopVoice = () => {
    //     const recorder = mediaRecorderRef.current;
    //     if (!recorder || recorder.state !== "recording") return;
    //     recorder.stop();
    // };

    const stopVoice = () => {
        // Stop silence detection
        silenceCleanupRef.current?.();
        silenceCleanupRef.current = null;
        hasReceivedAudioRef.current = false;

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

