"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./scroll-story.module.css";

const steps = [
  {
    id: "recall",
    index: "01 / Recall",
    title: "Your memory, ready when you need it.",
    body: "NEVER starts where your memory usually fails: not with folders, but with the thing you remember. Ask naturally, capture quickly, and come back to the context later.",
    tags: ["Ask NEVER", "Today", "Quick capture"],
    sprite: 0,
  },
  {
    id: "capture",
    index: "02 / Capture",
    title: "Capture it in the moment.",
    body: "Type a thought, paste a link or share something into NEVER. The capture flow stays deliberately light so saving never becomes another task.",
    tags: ["Note", "Link", "Share"],
    sprite: 1,
  },
  {
    id: "scan",
    index: "03 / Scan",
    title: "Turn documents into usable memory.",
    body: "Scan a page or choose a photo. NEVER keeps the original and extracts the useful information around it so the memory stays understandable later.",
    tags: ["Documents", "Context", "Review"],
    sprite: 2,
  },
  {
    id: "calendar",
    index: "04 / Calendar",
    title: "Dates stay connected to what created them.",
    body: "Plans, reminders and extracted dates live in one calm calendar view, while the original memory remains connected underneath.",
    tags: ["Day", "Week", "Month"],
    sprite: 3,
  },
] as const;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function ScrollStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
      setProgress(clamp(-rect.top / scrollable));
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const position = progress * (steps.length - 1);
  const active = Math.min(steps.length - 1, Math.max(0, Math.round(position)));
  const local = position - Math.floor(position);

  const storyStyle = {
    "--story-progress": progress,
    "--local-progress": local,
  } as CSSProperties;

  return (
    <section ref={sectionRef} id="experience" className={styles.story} style={storyStyle} aria-label="How NEVER works">
      <div className={styles.sticky}>
        <div className={styles.backdrop} aria-hidden="true" />
        <div className={styles.grid} aria-hidden="true" />
        <div className={styles.lightSweep} aria-hidden="true" />

        <div className={styles.progressRail} aria-hidden="true">
          <div className={styles.progressFill} style={{ transform: `scaleY(${Math.max(.015, progress)})` }} />
        </div>

        <div className={styles.stepDots} aria-hidden="true">
          {steps.map((step, index) => (
            <span
              key={step.id}
              className={index === active ? styles.dotActive : ""}
              style={{ opacity: .22 + .78 * clamp(1 - Math.abs(position - index)) }}
            />
          ))}
        </div>

        <div className={styles.shell}>
          <div className={styles.copyStack}>
            {steps.map((step, index) => {
              const delta = index - position;
              const visibility = clamp(1 - Math.abs(delta));
              const copyStyle = {
                opacity: visibility,
                transform: `translate3d(0, ${delta * 48}px, 0) scale(${.965 + visibility * .035})`,
                filter: `blur(${(1 - visibility) * 7}px)`,
                pointerEvents: visibility > .7 ? "auto" : "none",
              } as CSSProperties;

              return (
                <article key={step.id} className={styles.copy} style={copyStyle} aria-hidden={visibility < .5}>
                  <span className={styles.index}>{step.index}</span>
                  <h2>{step.title}</h2>
                  <p>{step.body}</p>
                  <div className={styles.meta}>{step.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                </article>
              );
            })}
          </div>

          <div className={styles.phoneStage}>
            <div className={styles.depthHalo} aria-hidden="true" />
            <div className={styles.deviceShadow} aria-hidden="true" />

            {steps.map((step, index) => {
              const delta = index - position;
              const visibility = clamp(1 - Math.abs(delta));
              const signed = Math.max(-1, Math.min(1, delta));
              const frameStyle = {
                opacity: visibility,
                transform: `translate3d(${signed * 44}px, ${Math.abs(delta) * 34}px, ${-Math.abs(delta) * 150}px) scale(${.91 + visibility * .09}) rotateY(${signed * -8}deg) rotateX(${signed * 1.8}deg)`,
                filter: `blur(${(1 - visibility) * 5}px) saturate(${.72 + visibility * .28}) brightness(${.82 + visibility * .18})`,
                zIndex: 20 - Math.round(Math.abs(delta) * 4),
              } as CSSProperties;

              const screenStyle = {
                backgroundPosition: `center ${step.sprite * (100 / (steps.length - 1))}%`,
              } as CSSProperties;

              return (
                <div key={step.id} className={styles.phoneWrap} style={frameStyle} aria-hidden={visibility < .5}>
                  <div className={styles.realDevice}>
                    <div className={styles.deviceEdge} aria-hidden="true" />
                    <div className={styles.screenViewport} style={screenStyle} role="img" aria-label={`NEVER ${step.id} screen`} />
                    <div className={styles.screenGlass} aria-hidden="true" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.chapterIndicator} aria-hidden="true">
          <span>{String(active + 1).padStart(2, "0")}</span>
          <i />
          <span>{String(steps.length).padStart(2, "0")}</span>
        </div>

        <span className={styles.endHint}>{progress > .9 ? "Continue to Explore" : "Scroll to move through NEVER"}</span>
      </div>
    </section>
  );
}
