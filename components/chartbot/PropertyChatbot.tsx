"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type MessageType = "text" | "properties" | "crime" | "error" | "thinking";
type MessageRole = "user" | "assistant";

interface Property {
    id: string;
    title: string;
    listingType: "sale" | "rent" | "student-housing";
    propertyType: string;
    city: string;
    state: string;
    numBedrooms: number;
    numBathrooms: number;
    furnishing: string;
    area?: number;
    rent?: number;
    price?: number;
    images?: { url: string }[];
    petsAllowed?: boolean;
    pool?: boolean;
    gym?: boolean;
    wifi?: boolean;
    security?: boolean;
    garden?: boolean;
    balcony?: boolean;
    parkingAvailable?: boolean;
    contactName?: string;
}

interface CrimeStation {
    id: string;
    station: string;
    district: string;
    province: string;
    safety_rating: number;
    safety_label: string;
    crime_index: number;
    total_serious_crimes_q1_2025: number;
    trend: "Improving" | "Stable" | "Worsening";
    crime_breakdown: Record<string, number>;
}

interface ChatMessage {
    id: string;
    role: MessageRole;
    type: MessageType;
    content?: string;
    properties?: Property[];
    crimeData?: CrimeStation[];
}

// ─── Suggested prompts ────────────────────────────────────────────────────────

const PROMPTS = [
    { icon: "🏠", label: "2-bed rent in Cape Town under R20k" },
    { icon: "🔒", label: "Safest areas in Gauteng" },
    { icon: "🎓", label: "Student housing near Pretoria unis" },
    { icon: "🌊", label: "KZN houses with a pool for sale" },
    { icon: "📊", label: "Crime stats for Sandton" },
    { icon: "🐾", label: "Pet-friendly furnished apartments" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 10);

const listingColors: Record<string, string> = {
    sale: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    rent: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    "student-housing": "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
};

const safetyColors: Record<number, { bg: string; border: string; text: string; badge: string }> = {
    5: {
        bg: "bg-emerald-50 dark:bg-emerald-950/30",
        border: "border-emerald-200 dark:border-emerald-800",
        text: "text-emerald-700 dark:text-emerald-400",
        badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    },
    4: {
        bg: "bg-teal-50 dark:bg-teal-950/30",
        border: "border-teal-200 dark:border-teal-800",
        text: "text-teal-700 dark:text-teal-400",
        badge: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
    },
    3: {
        bg: "bg-amber-50 dark:bg-amber-950/30",
        border: "border-amber-200 dark:border-amber-800",
        text: "text-amber-700 dark:text-amber-400",
        badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    },
    2: {
        bg: "bg-orange-50 dark:bg-orange-950/30",
        border: "border-orange-200 dark:border-orange-800",
        text: "text-orange-700 dark:text-orange-400",
        badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
    },
    1: {
        bg: "bg-red-50 dark:bg-red-950/30",
        border: "border-red-200 dark:border-red-800",
        text: "text-red-700 dark:text-red-400",
        badge: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
    },
};

const trendIcon: Record<string, string> = {
    Improving: "↑",
    Stable: "→",
    Worsening: "↓",
};
const trendColor: Record<string, string> = {
    Improving: "text-emerald-600 dark:text-emerald-400",
    Stable: "text-muted-foreground",
    Worsening: "text-destructive",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function PropertyCard({ p }: { p: Property }) {
    const img =
        p.images?.[0]?.url ||
        "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=240&fit=crop";
    const price = p.rent
        ? `R ${p.rent.toLocaleString("en-ZA")}/mo`
        : p.price
            ? `R ${p.price.toLocaleString("en-ZA")}`
            : "POA";
    const badgeCls = listingColors[p.listingType] ?? listingColors.sale;
    const amenities = [
        p.wifi && "WiFi",
        p.pool && "Pool",
        p.gym && "Gym",
        p.security && "Security",
        p.parkingAvailable && "Parking",
        p.garden && "Garden",
        p.balcony && "Balcony",
        p.petsAllowed && "Pets OK",
    ].filter(Boolean) as string[];

    const propertyLink = `/properties/${p.id}`;

    return (
        <a href={propertyLink} className="block rounded-xl border border-border bg-card overflow-hidden text-card-foreground shadow-sm hover:shadow-md transition-shadow">
            <div className="relative h-36 overflow-hidden">
                <img src={img} alt={p.title} className="w-full h-full object-cover" />
                <span
                    className={`absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${badgeCls}`}
                >
                    {p.listingType === "student-housing" ? "Student" : p.listingType}
                </span>
            </div>
            <div className="p-3 space-y-1.5">
                <div className="text-primary font-bold text-base leading-none">{price}</div>
                <div className="font-semibold text-sm leading-snug line-clamp-2">{p.title}</div>
                <div className="text-muted-foreground text-xs">
                    📍 {p.city}, {p.state}
                </div>
                <div className="flex flex-wrap gap-1">
                    {p.numBedrooms > 0 && (
                        <Chip>{p.numBedrooms} bed{p.numBedrooms !== 1 ? "s" : ""}</Chip>
                    )}
                    <Chip>{p.numBathrooms} bath{p.numBathrooms !== 1 ? "s" : ""}</Chip>
                    {p.area && <Chip>{p.area}m²</Chip>}
                    <Chip>
                        {p.furnishing === "furnished"
                            ? "Furnished"
                            : p.furnishing === "semi-furnished"
                                ? "Semi-furn."
                                : "Unfurnished"}
                    </Chip>
                </div>
                {amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                        {amenities.slice(0, 5).map((a) => (
                            <span key={a} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {a}
                            </span>
                        ))}
                    </div>
                )}
                {p.contactName && (
                    <div className="text-xs text-muted-foreground pt-1 border-t border-border">
                        Contact: {p.contactName}
                    </div>
                )}
            </div>
        </a>
    );
}

function CrimeCard({ s }: { s: CrimeStation }) {
    const c = safetyColors[s.safety_rating] ?? safetyColors[3];
    const topCrimes = Object.entries(s.crime_breakdown)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    return (
        <div className={`rounded-xl border-2 ${c.border} ${c.bg} overflow-hidden`}>
            <div className="flex items-start justify-between px-3 pt-3 pb-2">
                <div>
                    <div className="font-bold text-sm">{s.station}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                        {s.district} · {s.province}
                    </div>
                </div>
                <div className={`text-right shrink-0 ml-2 px-2 py-1 rounded-lg ${c.badge}`}>
                    <div className="text-lg font-extrabold leading-none">{s.safety_rating}/5</div>
                    <div className="text-[9px] font-semibold uppercase tracking-wider mt-0.5">{s.safety_label}</div>
                </div>
            </div>
            <div className="px-3 pb-3 space-y-2">
                <div className="grid grid-cols-3 gap-1.5">
                    <StatCell label="Crime Index" value={s.crime_index.toFixed(1)} />
                    <StatCell label="Q1 2025" value={String(s.total_serious_crimes_q1_2025)} />
                    <StatCell
                        label="Trend"
                        value={`${trendIcon[s.trend]} ${s.trend}`}
                        cls={trendColor[s.trend]}
                    />
                </div>
                {topCrimes.length > 0 && (
                    <div className="space-y-1">
                        <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-medium">
                            Top offences
                        </div>
                        {topCrimes.map(([type, count]) => (
                            <div key={type} className="flex justify-between text-xs">
                                <span className="text-muted-foreground truncate pr-2">{type}</span>
                                <span className="font-semibold shrink-0">{count}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCell({ label, value, cls = "" }: { label: string; value: string; cls?: string }) {
    return (
        <div className="bg-background/60 rounded-lg p-1.5 text-center">
            <div className={`font-bold text-xs leading-none ${cls}`}>{value}</div>
            <div className="text-[9px] text-muted-foreground mt-0.5">{label}</div>
        </div>
    );
}

function Chip({ children }: { children: React.ReactNode }) {
    return (
        <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md">
            {children}
        </span>
    );
}

function ThinkingDots() {
    return (
        <div className="flex items-center gap-1 py-1 px-1">
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary/40 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
                />
            ))}
        </div>
    );
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function MapPinIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                fill="currentColor"
                opacity="0.9"
            />
            <circle cx="12" cy="9" r="2.5" fill="white" />
        </svg>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

const DEFAULT_MESSAGES: ChatMessage[] = [
    {
        id: uid(),
        role: "assistant",
        type: "text",
        content:
            "Hello! I'm your Africa Property Finder assistant.\n\nAsk me to find properties, check safety ratings, or compare areas across South Africa.",
    },
];

const STORAGE_KEY = "property_chat_messages";

export default function PropertyChatbot() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        return parsed;
                    }
                } catch (e) {
                    console.error("Failed to parse stored messages", e);
                }
            }
        }
        return DEFAULT_MESSAGES;
    });
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        }
    }, [messages]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Lock body scroll when chat opens
    useEffect(() => {
        if (!open) return;

        const originalStyle = {
            overflow: document.body.style.overflow,
            position: document.body.style.position,
            top: document.body.style.top,
            width: document.body.style.width,
        };

        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${window.scrollY}px`;
        document.body.style.width = `calc(100% - ${scrollbarWidth}px)`;
        document.documentElement.style.overflow = 'hidden';

        return () => {
            const scrollY = document.body.style.top;
            document.body.style.overflow = originalStyle.overflow;
            document.body.style.position = originalStyle.position;
            document.body.style.top = originalStyle.top;
            document.body.style.width = originalStyle.width;
            document.documentElement.style.overflow = '';
            if (scrollY) {
                window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
            }
        };
    }, [open]);

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [open]);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        e.target.style.height = "auto";
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
    };

    const clearHistory = useCallback(() => {
        setMessages(DEFAULT_MESSAGES);
        localStorage.removeItem(STORAGE_KEY);
        setShowSuggestions(true);
        if (inputRef.current) {
            inputRef.current.value = "";
            setInput("");
        }
    }, []);

    const send = useCallback(
        async (text?: string) => {
            const msg = (text ?? input).trim();
            if (!msg || loading) return;
            setInput("");
            setShowSuggestions(false);
            if (inputRef.current) inputRef.current.style.height = "auto";

            const userMsg: ChatMessage = { id: uid(), role: "user", type: "text", content: msg };
            const thinkId = uid();
            setMessages((prev) => [
                ...prev,
                userMsg,
                { id: thinkId, role: "assistant", type: "thinking" },
            ]);
            setLoading(true);

            try {
                const history = messages.slice(-6).map((m) => ({
                    role: m.role,
                    content: typeof m.content === "string" ? m.content : "[results]",
                }));

                const res = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: msg, history }),
                });

                const data = await res.json();

                setMessages((prev) => prev.filter((m) => m.id !== thinkId));

                if (!res.ok) {
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: uid(),
                            role: "assistant",
                            type: "error",
                            content: data.message ?? "Something went wrong. Please try again.",
                        },
                    ]);
                    return;
                }

                const toAdd: ChatMessage[] = [];
                if (data.message) toAdd.push({ id: uid(), role: "assistant", type: "text", content: data.message });
                if (data.properties?.length) toAdd.push({ id: uid(), role: "assistant", type: "properties", properties: data.properties });
                if (data.crimeData?.length) toAdd.push({ id: uid(), role: "assistant", type: "crime", crimeData: data.crimeData });

                setMessages((prev) => [...prev, ...toAdd]);
            } catch {
                setMessages((prev) => [
                    ...prev.filter((m) => m.id !== thinkId),
                    { id: uid(), role: "assistant", type: "error", content: "Network error — please try again." },
                ]);
            } finally {
                setLoading(false);
            }
        },
        [input, loading, messages]
    );

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    return (
        <>
            {/* Backdrop overlay */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300"
                    onClick={() => setOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Floating trigger button */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
                {!open && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="bg-popover text-popover-foreground text-xs font-medium px-3 py-1.5 rounded-full shadow-md border border-border whitespace-nowrap">
                            Find a property or check area safety
                        </div>
                    </div>
                )}

                <button
                    onClick={() => setOpen((v) => !v)}
                    aria-label={open ? "Close chat" : "Open property assistant"}
                    className="relative w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center group"
                >
                    {open ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                    ) : (
                        <>
                            <MapPinIcon size={24} />
                            <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping opacity-0 group-hover:opacity-100 transition-opacity" />
                        </>
                    )}
                </button>
            </div>

            {/* Chat panel - LARGER & RESPONSIVE */}
            <div
                onClick={(e) => e.stopPropagation()}
                className={`
                    fixed bottom-24 right-6 z-50 
                    w-[500px] max-w-[calc(100vw-2rem)] 
                    sm:max-w-[500px] 
                    flex flex-col rounded-2xl border border-border bg-background shadow-2xl
                    transition-all duration-300 origin-bottom-right
                    ${open
                        ? "opacity-100 scale-100 pointer-events-auto translate-y-0"
                        : "opacity-0 scale-95 pointer-events-none translate-y-4"
                    }
                `}
                style={{ height: "min(700px, calc(100vh - 7rem))" }}
            >
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border rounded-t-2xl bg-card">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPinIcon size={18} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-foreground leading-none">Property Assistant</div>
                    </div>
                    <button
                        onClick={clearHistory}
                        className="w-7 h-7 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Clear chat history"
                        title="Clear chat history"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setOpen(false)}
                        className="w-7 h-7 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Minimise"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scroll-smooth">
                    {messages.map((m) => {
                        if (m.type === "properties" && m.properties) {
                            return (
                                <div key={m.id} className="grid grid-cols-1 gap-2.5">
                                    {m.properties.map((p) => <PropertyCard key={p.id} p={p} />)}
                                </div>
                            );
                        }
                        if (m.type === "crime" && m.crimeData) {
                            return (
                                <div key={m.id} className="grid grid-cols-1 gap-2.5">
                                    {m.crimeData.map((s) => <CrimeCard key={s.id} s={s} />)}
                                </div>
                            );
                        }
                        if (m.type === "thinking") {
                            return (
                                <div key={m.id} className="flex items-end gap-2">
                                    <Avatar />
                                    <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-3 py-2.5">
                                        <ThinkingDots />
                                    </div>
                                </div>
                            );
                        }
                        if (m.type === "error") {
                            return (
                                <div key={m.id} className="flex items-end gap-2">
                                    <Avatar />
                                    <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl rounded-bl-sm px-3 py-2.5 text-sm max-w-[90%]">
                                        ⚠️ {m.content}
                                    </div>
                                </div>
                            );
                        }
                        const isUser = m.role === "user";
                        return (
                            <div key={m.id} className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
                                {!isUser && <Avatar />}
                                <div
                                    className={`
                                        text-sm leading-relaxed px-3 py-2.5 rounded-2xl max-w-[90%] whitespace-pre-wrap
                                        ${isUser
                                            ? "bg-primary text-primary-foreground rounded-br-sm"
                                            : "bg-card border border-border text-card-foreground rounded-bl-sm"
                                        }
                                    `}
                                >
                                    {m.content}
                                </div>
                            </div>
                        );
                    })}

                    {showSuggestions && messages.length === 1 && messages[0].role === "assistant" && (
                        <div className="pt-1 space-y-1.5">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium px-1">
                                Try asking
                            </p>
                            {PROMPTS.map((p) => (
                                <button
                                    key={p.label}
                                    onClick={() => send(p.icon + " " + p.label)}
                                    className="w-full text-left text-xs px-3 py-2 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/30 text-foreground transition-colors duration-150"
                                >
                                    <span className="mr-1.5">{p.icon}</span>
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>

                {/* Input bar */}
                <div className="px-3 pb-3 pt-2 border-t border-border space-y-2">
                    <div className="flex items-end gap-2 bg-muted rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-ring transition-shadow">
                        <textarea
                            ref={inputRef}
                            rows={1}
                            value={input}
                            onChange={handleInput}
                            onKeyDown={onKeyDown}
                            disabled={loading}
                            placeholder="Ask about properties, safety, areas…"
                            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none max-h-[120px] leading-relaxed disabled:opacity-50"
                            style={{ minHeight: "24px" }}
                        />
                        <button
                            onClick={() => send()}
                            disabled={loading || !input.trim()}
                            aria-label="Send message"
                            className="w-8 h-6 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all"
                        >
                            {loading ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin">
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                </svg>
                            ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar() {
    return (
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mb-0.5">
            <MapPinIcon size={14} className="text-primary" />
        </div>
    );
}