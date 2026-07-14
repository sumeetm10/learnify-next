"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { X, Megaphone } from "lucide-react";

interface AnnouncementData {
  id: string;
  message: string;
  circleColor: string;
  boxColor: string;
}

interface AnnouncementContextValue {
  hasBanner: boolean;
}

const AnnouncementContext = createContext<AnnouncementContextValue>({ hasBanner: false });

export function useAnnouncement() {
  return useContext(AnnouncementContext);
}

const KEYFRAMES = `
@keyframes announcement-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@keyframes announcement-pulse {
  0% { box-shadow: 0 0 0 0 currentColor; }
  70% { box-shadow: 0 0 0 12px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
}
@keyframes announcement-slide-in {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes announcement-box-out {
  from { opacity: 1; max-width: 320px; margin-left: 0; }
  to { opacity: 0; max-width: 0; margin-left: 0; padding: 0; }
}
`;

export function AnnouncementProvider({ children }: { children: ReactNode }) {
  const [announcement, setAnnouncement] = useState<AnnouncementData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [boxHidden, setBoxHidden] = useState(false);
  const [entered, setEntered] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/announcements")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.message) {
          const dismissedId = localStorage.getItem("dismissed_announcement");
          if (dismissedId !== data.id) {
            setAnnouncement(data);
            requestAnimationFrame(() => {
              if (!cancelled) setEntered(true);
            });
          }
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const hasBanner = !!announcement && !dismissed;

  const toggleBox = () => {
    setBoxHidden((prev) => !prev);
  };

  return (
    <AnnouncementContext.Provider value={{ hasBanner }}>
      {children}
      {hasBanner && (
        <>
          <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />

          <div
            className="fixed bottom-6 left-6 z-[60] flex items-center"
            style={{
              opacity: entered ? 1 : 0,
              transform: entered ? "translateX(0)" : "translateX(-20px)",
              transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            {/* Circle icon — always visible */}
            <div
              className="shrink-0 relative cursor-pointer"
              onClick={toggleBox}
              style={{ color: announcement.circleColor }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-transform duration-300"
                style={{
                  backgroundColor: announcement.circleColor,
                  transform: hovered ? "scale(1.1)" : "scale(1)",
                  animation: hovered ? "none" : "announcement-pulse 2s infinite",
                }}
              >
                <Megaphone size={24} className="text-white" />
              </div>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md border-2 border-white">
                1
              </span>
            </div>

            {/* Message box — dismissible */}
            {!boxHidden && (
              <div
                className="relative overflow-hidden rounded-2xl shadow-2xl ml-0 transition-all duration-300 ease-out"
                style={{
                  backgroundColor: announcement.boxColor,
                  maxWidth: hovered ? "320px" : "200px",
                  animation: "announcement-slide-in 0.5s ease-out forwards",
                }}
              >
                {/* Shimmer overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    opacity: 0.15,
                    background:
                      "linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.4) 50%, transparent 75%)",
                    backgroundSize: "200% 100%",
                    animation: "announcement-shimmer 3s infinite linear",
                  }}
                />

                <div className="relative flex items-center gap-3 px-4 py-3">
                  <p className="text-white text-sm font-medium leading-snug flex-1 min-w-0">
                    {announcement.message}
                  </p>
                  <button
                    onClick={toggleBox}
                    className="shrink-0 w-7 h-7 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center cursor-pointer transition-all duration-200"
                    aria-label="Dismiss announcement"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </AnnouncementContext.Provider>
  );
}
