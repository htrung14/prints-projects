"use client";

import { useState, useRef, useEffect } from "react";

type Props = { src: string; alt: string };

export function ImageZoom({ src, alt }: Props) {
  const [fullscreen, setFullscreen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    if (dims.w === 0) setDims({ w: rect.width, h: rect.height });
  };

  const handleEnter = () => {
    setHovering(true);
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setDims({ w: rect.width, h: rect.height });
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const lens = 180;
  const zoom = 2.5;
  const { w, h } = dims;

  return (
    <>
      <div
        ref={ref}
        className="relative w-full h-full cursor-zoom-in"
        onMouseEnter={handleEnter}
        onMouseLeave={() => setHovering(false)}
        onMouseMove={handleMove}
        onClick={() => setFullscreen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setFullscreen(true);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Zoom image"
      >
        <img
          src={src}
          alt={alt}
          className="img-protected w-full h-full object-contain"
          draggable={false}
        />
        {hovering && w > 0 && (
          <div
            style={{
              position: "absolute",
              top: pos.y - lens / 2,
              left: pos.x - lens / 2,
              width: lens,
              height: lens,
              borderRadius: "50%",
              overflow: "hidden",
              pointerEvents: "none",
              border: "1px solid rgba(255,255,255,0.4)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
            }}
          >
            <img
              src={src}
              alt=""
              aria-hidden="true"
              style={{
                position: "absolute",
                width: w * zoom,
                height: h * zoom,
                transform: `translate(${-(pos.x * zoom - lens / 2)}px, ${-(pos.y * zoom - lens / 2)}px)`,
                maxWidth: "none",
              }}
            />
          </div>
        )}
      </div>

      {fullscreen && (
        <div
          onClick={() => setFullscreen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            backdropFilter: "blur(8px)",
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFullscreen(false);
            }}
            aria-label="Close"
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              color: "#fff",
              fontSize: 28,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 12,
            }}
          >
            ✕
          </button>
          <img
            src={src}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "92vw", maxHeight: "92vh", objectFit: "contain" }}
          />
        </div>
      )}
    </>
  );
}
