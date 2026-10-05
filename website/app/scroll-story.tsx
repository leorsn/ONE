"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./scroll-story.module.css";

const steps = [
  { id: "recall", name: "Recall", title: "Remember a little. Find the rest.", body: "A gift idea. A place someone mentioned. Start with the part you remember. Ask NEVER connects your question to what you saved.", detail: "Natural-language recall with NEVER AI" },
  { id: "capture", name: "Capture", title: "Keep it before the moment passes.", body: "Save a thought, paste a link or share from another app. A small capture now keeps the idea and its source together for later.", detail: "Notes · Links · Share" },
  { id: "scan", name: "Scan", title: "The page. And the context behind it.", body: "Scan a document or choose a photo. Keep the original, review the extracted details and save a memory you can return to.", detail: "Original document · Recognized text · Review" },
  { id: "calendar", name: "Calendar", title: "Remember when it matters.", body: "A reservation becomes a plan. A saved date becomes a reminder. Your calendar keeps the day connected to the memory behind it.", detail: "Dates · Plans · Reminders" },
] as const;
const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function ScrollStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const copies = section.querySelectorAll<HTMLElement>("[data-copy]");
    const screens = section.querySelectorAll<HTMLElement>("[data-screen]");
    let frame = 0;
    let visible = true;
    let chapter = -1;
    const update = () => {
      frame = 0;
      if (motion.matches || !visible) return;
      const bounds = section.getBoundingClientRect();
      const progress = clamp(-bounds.top / Math.max(1, bounds.height - window.innerHeight));
      // Short holds keep the first and final chapters readable.
      const position = Math.max(0, Math.min(3, progress * 4 - .5));
      section.style.setProperty("--story-progress", String(progress));
      copies.forEach((copy, index) => {
        const delta = index - position;
        copy.style.opacity = String(clamp((.49 - Math.abs(delta)) / .22));
        copy.style.transform = `translate3d(0,${Math.max(-1, Math.min(1, delta)) * 18}px,0)`;
      });
      screens.forEach((screen, index) => { screen.style.opacity = String(clamp(1 - Math.abs(index - position))); });
      const next = Math.round(position);
      if (next !== chapter) { chapter = next; setActive(next); }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const configure = () => { section.dataset.enhanced = String(!motion.matches); schedule(); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) schedule(); }, { rootMargin: "150px" });
    observer.observe(section);
    configure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    motion.addEventListener("change", configure);
    return () => {
      cancelAnimationFrame(frame); observer.disconnect();
      window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); motion.removeEventListener("change", configure);
    };
  }, []);

  function goToChapter(index: number) {
    const section = sectionRef.current;
    if (!section) return;
    if (section.dataset.enhanced !== "true") { section.querySelectorAll("[data-copy]")[index]?.scrollIntoView(); return; }
    const top = window.scrollY + section.getBoundingClientRect().top;
    window.scrollTo({ top: top + ((index + .5) / 4) * (section.offsetHeight - window.innerHeight), behavior: "smooth" });
  }
  return (
    <section ref={sectionRef} id="experience" className={styles.story} aria-label="How NEVER works">
      <div className={styles.sticky}>
        <div className={styles.backdrop} aria-hidden="true" />
        <div className={styles.shell}>
          <div className={styles.copyStack}>
            {steps.map((step, index) => <article key={step.id} data-copy className={styles.copy}>
              <div className={styles.words}><p className={styles.index}>{String(index + 1).padStart(2, "0")} / {step.name}</p><h2>{step.title}</h2><p className={styles.body}>{step.body}</p><p className={styles.detail}>{step.detail}</p></div>
              <div className={styles.staticPhone} aria-hidden="true"><Image src={`/screens/${step.id}.webp`} alt="" width={780} height={1688} sizes="260px" /></div>
            </article>)}
          </div>
          <div className={styles.phoneStage} aria-hidden="true">
            <div className={styles.halo} />
            <div className={styles.device}><div className={styles.screenViewport}>
              {steps.map((step, index) => <Image data-screen key={step.id} src={`/screens/${step.id}.webp`} alt="" width={780} height={1688} sizes="(max-width: 820px) 230px, 310px" className={styles.screen} style={{ opacity: index === 0 ? 1 : 0 }} />)}
            </div><div className={styles.island} /><div className={styles.glass} /></div>
          </div>
        </div>
        <nav className={styles.chapters} aria-label="Product story chapters">{steps.map((step, index) => <button type="button" key={step.id} onClick={() => goToChapter(index)} aria-current={active === index ? "step" : undefined}><span>{String(index + 1).padStart(2, "0")}</span>{step.name}</button>)}</nav>
        <div className={styles.rail} aria-hidden="true"><i /></div>
      </div>
    </section>
  );
}
