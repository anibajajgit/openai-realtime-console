
import React, { useEffect } from "react";
import { cn } from "../utils/styleUtils";

// ElegantShape component for the moving shapes in the background
function ElegantShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = "from-white/[0.08]",
}) {
  return (
    <div
      className={cn("absolute transition-all duration-[2400ms]", className)}
      style={{
        opacity: 0,
        transform: `translateY(-150px) rotate(${rotate - 15}deg)`,
        animationDelay: `${delay}s`,
        animationDuration: "2.4s",
        animationFillMode: "forwards",
        animationName: "shapeAppear",
      }}
    >
      <div
        className="relative animate-float"
        style={{
          width,
          height,
        }}
      >
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            "bg-gradient-to-r to-transparent",
            gradient,
            "backdrop-blur-[2px] border-2 border-white/[0.15]",
            "shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]",
            "after:absolute after:inset-0 after:rounded-full",
            "after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]"
          )}
        />
      </div>
    </div>
  );
}

// HeroGeometric component for the overall hero section
function HeroGeometric({
  badge = "Scenario Simulator",
  title1 = "Practice Real-World",
  title2 = "Communication Skills",
  children,
}) {
  useEffect(() => {
    // Add keyframes for animations
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes shapeAppear {
        0% { opacity: 0; transform: translateY(-150px) rotate(var(--rotate-start)); }
        100% { opacity: 1; transform: translateY(0) rotate(var(--rotate-end)); }
      }
      
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .animate-float {
        animation: float 12s ease-in-out infinite;
      }
      
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(15px); }
      }
      
      .fade-up {
        opacity: 0;
        transform: translateY(30px);
        animation: fadeUp 1s ease-out forwards;
      }
      
      .delay-1 {
        animation-delay: 0.7s;
      }
      
      .delay-2 {
        animation-delay: 0.9s;
      }
      
      .delay-3 {
        animation-delay: 1.1s;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#030303]">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl" />

      <div className="absolute inset-0 overflow-hidden">
        <ElegantShape
          delay={0.3}
          width={600}
          height={140}
          rotate={12}
          gradient="from-indigo-500/[0.15]"
          className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
          style={{ "--rotate-start": "12deg", "--rotate-end": "-3deg" }}
        />

        <ElegantShape
          delay={0.5}
          width={500}
          height={120}
          rotate={-15}
          gradient="from-rose-500/[0.15]"
          className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
          style={{ "--rotate-start": "-15deg", "--rotate-end": "-15deg" }}
        />

        <ElegantShape
          delay={0.4}
          width={300}
          height={80}
          rotate={-8}
          gradient="from-violet-500/[0.15]"
          className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
          style={{ "--rotate-start": "-8deg", "--rotate-end": "-8deg" }}
        />

        <ElegantShape
          delay={0.6}
          width={200}
          height={60}
          rotate={20}
          gradient="from-amber-500/[0.15]"
          className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
          style={{ "--rotate-start": "20deg", "--rotate-end": "20deg" }}
        />

        <ElegantShape
          delay={0.7}
          width={150}
          height={40}
          rotate={-25}
          gradient="from-cyan-500/[0.15]"
          className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
          style={{ "--rotate-start": "-25deg", "--rotate-end": "-25deg" }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] mb-8 md:mb-12 fade-up delay-1">
            <div className="h-2 w-2 bg-rose-500/80 rounded-full"></div>
            <span className="text-sm text-white/60 tracking-wide">
              {badge}
            </span>
          </div>

          <div className="fade-up delay-2">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold mb-6 md:mb-8 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">
                {title1}
              </span>
              <br />
              <span
                className={cn(
                  "bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300"
                )}
              >
                {title2}
              </span>
            </h1>
          </div>

          <div className="fade-up delay-3">
            <p className="text-base sm:text-lg md:text-xl text-white/40 mb-8 leading-relaxed font-light tracking-wide max-w-xl mx-auto px-4">
              Practice real-world scenarios with AI-powered role-playing
            </p>
            {children}
          </div>
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-[#030303]/80 pointer-events-none" />
    </div>
  );
}

export { HeroGeometric, ElegantShape };
