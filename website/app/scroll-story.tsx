"use client";

import { useEffect, useRef, useState } from "react";
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

export function ScrollStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
      const raw = Math.min(1, Math.max(0, -rect.top / scrollable));
      const next = Math.min(steps.length - 1, Math.floor(raw * steps.length));

      setProgress(raw);
      setActive(next);
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

  return (
    <section ref={sectionRef} id="experience" className={styles.story} aria-label="How NEVER works">
      <div className={styles.sticky}>
        <div className={styles.backdrop} aria-hidden="true" />
        <div className={styles.grid} aria-hidden="true" />

        <div className={styles.progressRail} aria-hidden="true">
          <div className={styles.progressFill} style={{ transform: `scaleY(${Math.max(.015, progress)})` }} />
        </div>

        <div className={styles.stepDots} aria-hidden="true">
          {steps.map((step, index) => <span key={step.id} className={index === active ? styles.dotActive : ""} />)}
        </div>

        <div className={styles.shell}>
          <div className={styles.copyStack}>
            {steps.map((step, index) => (
              <article key={step.id} className={`${styles.copy} ${index === active ? styles.copyActive : ""}`} aria-hidden={index !== active}>
                <span className={styles.index}>{step.index}</span>
                <h2>{step.title}</h2>
                <p>{step.body}</p>
                <div className={styles.meta}>{step.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              </article>
            ))}
          </div>

          <div className={styles.phoneStage}>
            <div className={styles.higgsfieldSlot} data-higgsfield-layer="product-cinematic" aria-hidden="true" />
            {steps.map((step, index) => (
              <div key={step.id} className={`${styles.phoneWrap} ${index === active ? styles.phoneActive : ""}`} aria-hidden={index !== active}>
                <PhoneFrame variant={step.world} screen={step.screen} />
              </div>
            ))}
          </div>
        </div>

        <span className={styles.endHint}>Scroll to move through NEVER</span>
      </div>
    </section>
  );
}
