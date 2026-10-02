"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PhoneFrame, type NeverScreen } from "./phone-frame";
import type { WorldId } from "./worlds";
import styles from "./scroll-story.module.css";

const steps: Array<{
  id: string;
  index: string;
  title: string;
  body: string;
  tags: string[];
  screen: NeverScreen;
  world: WorldId;
}> = [
  {
    id: "capture",
    index: "01 / Capture",
    title: "Save it before it disappears.",
    body: "Share a link, screenshot, document or thought into NEVER. The original item stays attached to the context that makes it useful.",
    tags: ["Share", "Scan", "Quick capture"],
    screen: "capture",
    world: "aurora",
  },
  {
    id: "understand",
    index: "02 / Understand",
    title: "NEVER keeps the context.",
    body: "Dates, subjects, source information and useful details stay connected to what you saved, so you do not have to rebuild the meaning later.",
    tags: ["Context", "Source", "Details"],
    screen: "home",
    world: "aurora",
  },
  {
    id: "organize",
    index: "03 / Organize",
    title: "No folder maintenance required.",
    body: "Saved gives your links, images, documents and ideas a usable structure. Browse by type, search by text or return through the context around a memory.",
    tags: ["Saved", "Filters", "Library"],
    screen: "saved",
    world: "platinum",
  },
  {
    id: "calendar",
    index: "04 / Calendar",
    title: "Plans stay connected to why they matter.",
    body: "Dates and reminders live beside the memories behind them. Move between day, week and month without losing the original source.",
    tags: ["Day", "Week", "Month"],
    screen: "calendar",
    world: "tidal",
  },
  {
    id: "recall",
    index: "05 / Ask NEVER",
    title: "Ask the way you remember.",
    body: "Instead of remembering where something was saved, ask naturally. NEVER finds the relevant memories and points back to the items used in the answer.",
    tags: ["Semantic search", "Sources", "NEVER AI"],
    screen: "search",
    world: "monolith",
  },
  {
    id: "resurface",
    index: "06 / Resurface",
    title: "The right memory comes back.",
    body: "Today brings recent captures, plans and reminders back into view. The system is designed around usefulness, not accumulation.",
    tags: ["Today", "Recall", "Relevant again"],
    screen: "home",
    world: "aurora",
  },
];

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
                transform: `translate3d(0, ${delta * 42}px, 0) scale(${.97 + visibility * .03})`,
                filter: `blur(${(1 - visibility) * 6}px)`,
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
            {steps.map((step, index) => {
              const delta = index - position;
              const visibility = clamp(1 - Math.abs(delta));
              const signed = Math.max(-1, Math.min(1, delta));
              const phoneStyle = {
                opacity: visibility,
                transform: `translate3d(${signed * 34}px, ${Math.abs(delta) * 28}px, ${-Math.abs(delta) * 130}px) scale(${.9 + visibility * .1}) rotateY(${signed * -7}deg) rotateX(${signed * 1.5}deg)`,
                filter: `blur(${(1 - visibility) * 4}px) saturate(${.75 + visibility * .25})`,
                zIndex: 10 - Math.round(Math.abs(delta) * 2),
              } as CSSProperties;

              return (
                <div key={step.id} className={styles.phoneWrap} style={phoneStyle} aria-hidden={visibility < .5}>
                  <PhoneFrame variant={step.world} screen={step.screen} />
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

        <span className={styles.endHint}>{progress > .92 ? "Continue to Explore" : "Scroll to move through NEVER"}</span>
      </div>
    </section>
  );
}
