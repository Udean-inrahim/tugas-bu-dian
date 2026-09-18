import { useEffect, useState } from "react";
import type { Condition } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Mood = "hot" | "cold" | "happy" | "nodata";

const MOOD_MESSAGE: Record<Mood, string> = {
  hot: "Uduh panas banget! 🥵 Kipas-kipas dulu yuk.",
  cold: "Brrr, dingin! ❄️ Aku gemeteran nih.",
  happy: "Suhunya adem & stabil. Aku adem ayem~ 😌",
  nodata: "Belum ada data. Tapi aku temanin kamu kok 👀",
};

const MOOD_LINE: Record<Mood, string> = {
  hot: "Maskot lagi kepanasan!",
  cold: "Maskot sedang gemeteran…",
  happy: "Maskot lagi ceria, suhu adem!",
  nodata: "Maskot bingung, belum ada data.",
};

const POKE_MESSAGES = [
  "Hehe, geli! 😆",
  "Aduh… yang sabar dong 😝",
  "Klik-klik terus, capek nih! 😅",
  "Wih, akrab banget kamu! 🤝",
  "Peekaboo! 👀",
];

const COLORS: Record<Mood, { main: string; glow: string }> = {
  hot: { main: "#f43f5e", glow: "#f43f5e" },
  cold: { main: "#38bdf8", glow: "#38bdf8" },
  happy: { main: "#22c55e", glow: "#22c55e" },
  nodata: { main: "#94a3b8", glow: "#94a3b8" },
};

interface MascotProps {
  mood: Mood;
  pokeTick: number;
  cheerTick: number;
  bubble: string | null;
}

function FunMascot({ mood, pokeTick, cheerTick, bubble }: MascotProps) {
  const c = COLORS[mood];

  return (
    <div className="relative shrink-0">
      {bubble && (
        <div className="absolute -top-3 left-1/2 z-10 w-44 -translate-x-1/2 -translate-y-full rounded-2xl border border-muted bg-white px-3 py-2 text-center text-xs font-semibold shadow-xl">
          <span className="text-ink">{bubble}</span>
          <span className="absolute left-1/2 top-full -mt-1 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-muted bg-white" />
        </div>
      )}

      {cheerTick > 0 && (
        <svg
          key={cheerTick}
          viewBox="0 0 120 170"
          className="pointer-events-none absolute inset-0 h-28 w-24"
        >
          <text x="14" y="26" style={{ fontSize: 16 }}>💜</text>
          <text x="88" y="42" style={{ fontSize: 12 }}>✨</text>
          <text x="100" y="120" style={{ fontSize: 13 }}>💜</text>
          <text x="6" y="132" style={{ fontSize: 11 }}>✨</text>
        </svg>
      )}

      <div
        key={pokeTick}
        className={cn(mood === "cold" && "mascot-shiver", pokeTick > 0 && "mascot-wiggle")}
      >
        <div className={cn(mood === "happy" && "mascot-bob")}>
          <svg viewBox="0 0 120 170" className="h-28 w-24 drop-shadow-md">
            {/* halo */}
            <circle cx="60" cy="118" r="44" fill={c.glow} opacity="0.3" />
            <circle cx="60" cy="118" r="52" fill={c.glow} opacity="0.12" />

            {/* tabung */}
            <rect x="42" y="10" width="36" height="80" rx="18" fill="#ffffff" opacity="0.95" />
            <rect x="42" y="10" width="36" height="80" rx="18" fill="none" stroke={c.main} strokeWidth="2.5" />
            {/* skala tabung */}
            {[24, 34, 44, 54, 64].map((y) => (
              <line key={y} x1="44" y1={y} x2="48" y2={y} stroke="#cbd5e1" strokeWidth="2" />
            ))}
            {/* air raksa */}
            <rect x="48" y="56" width="24" height="34" rx="12" fill={c.main} opacity="0.9" />

            {/* tangan */}
            <path d="M42 50 Q 30 44 24 36" fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
            <path d="M78 50 Q 90 44 96 36" fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />

            {/* bohlam (wajah) */}
            <circle cx="60" cy="118" r="30" fill={c.main} />
            <ellipse cx="50" cy="106" rx="9" ry="6" fill="#ffffff" opacity="0.35" />

            {/* wajah */}
            <g transform="translate(60 118)">
              <g className="mascot-blink" style={{ transformOrigin: "center" }}>
                <circle cx="-9" cy="-5" r="3.4" fill="#1e293b" />
                <circle cx="9" cy="-5" r="3.4" fill="#1e293b" />
              </g>
              <circle cx="-16" cy="3" r="4" fill="#fb7185" opacity="0.75" />
              <circle cx="16" cy="3" r="4" fill="#fb7185" opacity="0.75" />

              {mood === "hot" && (
                <>
                  <path d="M -9,7 A 9 9 0 0 0 9,7" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M -4,11 L 4,11 L 2,15 Q 0,18 -2,15 Z" fill="#f87171" />
                </>
              )}
              {mood === "cold" && (
                <>
                  <path d="M -11,5 L -4,9 L -11,9 L -4,13" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M 4,5 L 11,9 L 4,9 L 11,13" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </>
              )}
              {mood === "happy" && (
                <path d="M -11,3 Q 0,14 11,3" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
              )}
              {mood === "nodata" && (
                <>
                  <line x1="-11" y1="-5" x2="-6" y2="-5" stroke="#1e293b" strokeWidth="2.4" strokeLinecap="round" />
                  <line x1="6" y1="-5" x2="11" y2="-5" stroke="#1e293b" strokeWidth="2.4" strokeLinecap="round" />
                  <path d="M -7,9 Q 0,6 7,9" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
                </>
              )}
            </g>

            {/* efek kondisi */}
            {mood === "hot" && (
              <g>
                <circle className="mascot-drop" cx="88" cy="34" r="3" fill="#38bdf8" />
                <circle className="mascot-drop" style={{ animationDelay: "0.5s" }} cx="94" cy="40" r="2.5" fill="#38bdf8" />
              </g>
            )}
            {mood === "cold" && (
              <g>
                <text className="mascot-spin" x="16" y="40" style={{ fontSize: 14, transformOrigin: "22px 40px" }}>❄️</text>
                <text
                  className="mascot-spin"
                  style={{ animationDirection: "reverse", fontSize: 11, transformOrigin: "104px 96px" }}
                  x="98"
                  y="96"
                >
                  ❄️
                </text>
              </g>
            )}
            {mood === "happy" && (
              <g>
                <text className="mascot-pop" style={{ fontSize: 12, animationIterationCount: "infinite", animationDelay: "0.6s" }} x="12" y="66">✨</text>
                <text className="mascot-pop" style={{ fontSize: 10, animationIterationCount: "infinite" }} x="100" y="150">✨</text>
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}

interface MoodBarProps {
  temperature: number | null;
  condition: Condition;
}

export function MoodBar({ temperature, condition }: MoodBarProps) {
  const mood: Mood =
    temperature === null
      ? "nodata"
      : condition.color === "red"
        ? "hot"
        : condition.color === "blue"
          ? "cold"
          : "happy";

  const [pokeTick, setPokeTick] = useState(0);
  const [cheerTick, setCheerTick] = useState(0);
  const [bubble, setBubble] = useState<string | null>(null);

  useEffect(() => {
    if (!bubble) return;
    const id = setTimeout(() => setBubble(null), 2200);
    return () => clearTimeout(id);
  }, [bubble]);

  const poke = () => {
    setPokeTick((t) => t + 1);
    setBubble(POKE_MESSAGES[Math.floor(Math.random() * POKE_MESSAGES.length)]);
  };

  const cheer = () => {
    setCheerTick((t) => t + 1);
    setBubble("Makasih semangatnya! 💜");
  };

  return (
    <Card className="p-5">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <FunMascot mood={mood} pokeTick={pokeTick} cheerTick={cheerTick} bubble={bubble} />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="micro-label mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-primary">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            Mood Monitor
          </p>
          <p className="mb-1 text-xl font-extrabold tracking-tight text-ink">{MOOD_LINE[mood]}</p>
          <p className="text-sm text-muted-foreground">{MOOD_MESSAGE[mood]}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Button variant="outline" onClick={poke}>
            Gelitik 😝
          </Button>
          <Button variant="default" onClick={cheer}>
            Kasih Semangat 💜
          </Button>
        </div>
      </div>
    </Card>
  );
}