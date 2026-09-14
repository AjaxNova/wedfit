"use client";
import { memo, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { animate } from "motion/react";

const GlowingEffect = memo(
  ({
    blur = 0,
    inactiveZone = 0,
    proximity = 100,
    spread = 45,
    variant = "default",
    glow = true,
    className,
    movementDuration = 1.5,
    borderWidth = 2,
    disabled = false
  }) => {
    const containerRef = useRef(null);
    const lastPosition = useRef({ x: 0, y: 0 });
    const animationFrameRef = useRef(0);

    const handleMove = useCallback(
      (e) => {
        if (!containerRef.current) return;

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        animationFrameRef.current = requestAnimationFrame(() => {
          const element = containerRef.current;
          if (!element) return;

          const { left, top, width, height } = element.getBoundingClientRect();
          const mouseX = e?.clientX ?? (e?.x ?? lastPosition.current.x);
          const mouseY = e?.clientY ?? (e?.y ?? lastPosition.current.y);

          if (e && (e.clientX !== undefined || e.x !== undefined)) {
            lastPosition.current = { x: mouseX, y: mouseY };
          }

          const center = [left + width * 0.5, top + height * 0.5];
          const distanceFromCenter = Math.hypot(
            mouseX - center[0],
            mouseY - center[1]
          );
          const inactiveRadius = 0.5 * Math.min(width, height) * inactiveZone;

          if (inactiveZone > 0 && distanceFromCenter < inactiveRadius) {
            element.style.setProperty("--active", glow ? "0.35" : "0");
            return;
          }

          const isActive =
            mouseX > left - proximity &&
            mouseX < left + width + proximity &&
            mouseY > top - proximity &&
            mouseY < top + height + proximity;

          element.style.setProperty("--active", isActive ? "1" : (glow ? "0.35" : "0"));

          if (!isActive) return;

          const currentAngle =
            parseFloat(element.style.getPropertyValue("--start")) || 0;
          let targetAngle =
            (180 * Math.atan2(mouseY - center[1], mouseX - center[0])) /
              Math.PI +
            90;

          const angleDiff = ((targetAngle - currentAngle + 180) % 360) - 180;
          const newAngle = currentAngle + angleDiff;

          animate(currentAngle, newAngle, {
            duration: movementDuration,
            ease: [0.16, 1, 0.3, 1],
            onUpdate: (value) => {
              element.style.setProperty("--start", String(value));
            },
          });
        });
      },
      [inactiveZone, proximity, movementDuration, glow]
    );

    useEffect(() => {
      if (disabled) return;

      const handleScroll = () => handleMove();
      const handlePointerMove = (e) => handleMove(e);

      window.addEventListener("scroll", handleScroll, { passive: true });
      document.body.addEventListener("pointermove", handlePointerMove, {
        passive: true,
      });

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        window.removeEventListener("scroll", handleScroll);
        document.body.removeEventListener("pointermove", handlePointerMove);
      };
    }, [handleMove, disabled]);

    return (
      <div
        ref={containerRef}
        style={{
          "--blur": `${blur}px`,
          "--spread": spread,
          "--start": "0",
          "--active": glow ? "0.35" : "0",
          "--glowingeffect-border-width": `${borderWidth}px`,
          "--gradient":
            variant === "white"
              ? `conic-gradient(from calc((var(--start, 0) - var(--spread, 45)) * 1deg), transparent 0deg, #ffffff 30deg, transparent calc(var(--spread, 45) * 2deg))`
              : variant === "red"
              ? `conic-gradient(from calc((var(--start, 0) - var(--spread, 45)) * 1deg), transparent 0deg, #E14953 20deg, #FF6B75 40deg, #D4AF37 60deg, transparent calc(var(--spread, 45) * 2deg))`
              : `conic-gradient(from calc((var(--start, 0) - var(--spread, 45)) * 1deg), transparent 0deg, #dd7bbb 20deg, #d79f1e 40deg, #5a922c 60deg, transparent calc(var(--spread, 45) * 2deg))`
        }}
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity",
          className,
          disabled && "!hidden"
        )}
      >
        <div className={cn("glow", `glow--${variant}`, "rounded-[inherit]")} />
      </div>
    );
  }
);

GlowingEffect.displayName = "GlowingEffect";

export { GlowingEffect };
