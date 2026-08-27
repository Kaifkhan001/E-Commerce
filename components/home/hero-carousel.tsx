"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { cn } from "@/lib/utils/cn";

type Slide = { src: string; alt: string };

const DESKTOP_SLIDES: Slide[] = [
  { src: "/banner-images/multi-banner__media-desktop-01.png", alt: "Aramis bags, lifestyle image 1" },
  { src: "/banner-images/multi-banner__media-desktop-02.png", alt: "Aramis bags, lifestyle image 2" },
  { src: "/banner-images/multi-banner__media-desktop-03.png", alt: "Aramis bags, lifestyle image 3" },
  { src: "/banner-images/multi-banner__media-desktop-04.png", alt: "Aramis bags, lifestyle image 4" },
];

const MOBILE_SLIDES: Slide[] = [
  { src: "/banner-images/multi-banner__media-mobile-01.png", alt: "Aramis bags, lifestyle image 1" },
  { src: "/banner-images/multi-banner__media-mobile-02.png", alt: "Aramis bags, lifestyle image 2" },
  { src: "/banner-images/multi-banner__media-mobile-03.png", alt: "Aramis bags, lifestyle image 3" },
  { src: "/banner-images/multi-banner__media-mobile-04.png", alt: "Aramis bags, lifestyle image 4" },
];

const SLIDE_COUNT = DESKTOP_SLIDES.length;
const AUTO_ADVANCE_MS = 5000;
const SWIPE_OFFSET_THRESHOLD = 60;
const SWIPE_VELOCITY_THRESHOLD = 300;

// Slides are mounted once (the first time they're shown) and then kept in the DOM,
// crossfading via opacity instead of mounting/unmounting on every change. Each slide
// still only loads its image the first time it becomes active, so we never eagerly
// fetch all 4 images up front.
//
// Swiping is implemented with plain Pointer Events rather than Framer Motion's `drag`
// prop: in this project's framer-motion/React combination, Framer's own drag gesture
// recognizer never fires (verified — a native onPointerDown reaches the element
// reliably, but Framer's onDragStart/onDrag/onDragEnd never do), so the gesture is
// tracked manually here using the same offset/velocity threshold logic.
function SlideLayer({
  slides,
  index,
  reducedMotion,
  onSwipeEnd,
}: {
  slides: Slide[];
  index: number;
  reducedMotion: boolean;
  onSwipeEnd: (offsetX: number, velocityX: number) => void;
}) {
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0]));
  const [prevIndex, setPrevIndex] = useState(index);
  if (index !== prevIndex) {
    setPrevIndex(index);
    if (!visited.has(index)) {
      setVisited(new Set(visited).add(index));
    }
  }
  const fadeDuration = reducedMotion ? 0 : 0.7;

  const dragStateRef = useRef<{ pointerId: number; startX: number; startTime: number } | null>(null);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Some environments (e.g. automated pointer dispatch) don't back the pointer id
      // with an active session; capture is a robustness nicety, not a requirement.
    }
    dragStateRef.current = { pointerId: event.pointerId, startX: event.clientX, startTime: performance.now() };
  }, []);

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const state = dragStateRef.current;
      dragStateRef.current = null;
      if (!state || event.pointerId !== state.pointerId) return;
      const offsetX = event.clientX - state.startX;
      const elapsedMs = Math.max(1, performance.now() - state.startTime);
      const velocityX = (offsetX / elapsedMs) * 1000;
      onSwipeEnd(offsetX, velocityX);
    },
    [onSwipeEnd]
  );

  const handlePointerCancel = useCallback(() => {
    dragStateRef.current = null;
  }, []);

  return (
    <div className="absolute inset-0">
      {slides.map((slide, i) =>
        visited.has(i) ? (
          <motion.div
            key={i}
            className={cn("absolute inset-0", i === index ? "pointer-events-auto" : "pointer-events-none")}
            style={i === index ? { touchAction: "pan-y" } : undefined}
            initial={i === 0 ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: i === index ? 1 : 0 }}
            transition={{ duration: fadeDuration, ease: "easeInOut" }}
            onPointerDown={i === index && !reducedMotion ? handlePointerDown : undefined}
            onPointerUp={i === index && !reducedMotion ? handlePointerUp : undefined}
            onPointerCancel={i === index && !reducedMotion ? handlePointerCancel : undefined}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>
        ) : null
      )}
    </div>
  );
}

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const prefersReducedMotion = Boolean(useReducedMotion());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    if (prefersReducedMotion) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDE_COUNT);
    }, AUTO_ADVANCE_MS);
  }, [clearTimer, prefersReducedMotion]);

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [startTimer, clearTimer]);

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % SLIDE_COUNT) + SLIDE_COUNT) % SLIDE_COUNT);
      startTimer();
    },
    [startTimer]
  );

  const handleSwipeEnd = useCallback(
    (offsetX: number, velocityX: number) => {
      if (offsetX < -SWIPE_OFFSET_THRESHOLD || velocityX < -SWIPE_VELOCITY_THRESHOLD) {
        goTo(index + 1);
      } else if (offsetX > SWIPE_OFFSET_THRESHOLD || velocityX > SWIPE_VELOCITY_THRESHOLD) {
        goTo(index - 1);
      }
    },
    [goTo, index]
  );

  return (
    <>
      <div className="absolute inset-0 hidden md:block">
        <SlideLayer slides={DESKTOP_SLIDES} index={index} reducedMotion={prefersReducedMotion} onSwipeEnd={handleSwipeEnd} />
      </div>
      <div className="absolute inset-0 md:hidden">
        <SlideLayer slides={MOBILE_SLIDES} index={index} reducedMotion={prefersReducedMotion} onSwipeEnd={handleSwipeEnd} />
      </div>
    </>
  );
}
