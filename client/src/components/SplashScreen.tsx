import { useEffect, useState } from "react";

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade-out after 1.1s
    const fadeTimer = setTimeout(() => setFadeOut(true), 1100);
    // Call onFinish after fade completes (1.1s + 400ms fade)
    const finishTimer = setTimeout(() => onFinish(), 1500);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0A0F1C]"
      style={{
        transition: "opacity 400ms ease-out",
        opacity: fadeOut ? 0 : 1,
        pointerEvents: fadeOut ? "none" : "all",
      }}
    >
      {/* Logo RIDDY */}
      <div
        className="flex flex-col items-center gap-3"
        style={{
          animation: "splashPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        }}
      >
        {/* Logo mark */}
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl"
            style={{ background: "linear-gradient(135deg, #00E5CC 0%, #0099FF 100%)" }}
          >
            R
          </div>
          <span
            className="text-4xl font-black tracking-tight text-white"
            style={{ letterSpacing: "-0.02em" }}
          >
            RIDDY
          </span>
        </div>

        {/* Tagline */}
        <p className="text-sm text-white/40 font-medium tracking-widest uppercase">
          Redefinindo Mobilidade
        </p>
      </div>

      <style>{`
        @keyframes splashPop {
          0% { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
