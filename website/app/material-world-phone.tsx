import { Icon } from "./icons";
import type { WorldId } from "./worlds";
import styles from "./material-world-phone.module.css";

/**
 * Website-only static rendering of the native NEVER HomeV5 / Pass 3 visual hierarchy.
 * Source of truth: src/screens/HomeV5.tsx, src/theme/tokens.ts,
 * src/theme/editions.ts and src/ui/appleV5.tsx on design/never-material-worlds.
 * These are illustrations of example memories; no real account data is displayed.
 * Every world shows the SAME UI; only native theme artwork and approved tokens change.
 */
export function MaterialWorldPhone({ world }: { world: WorldId }) {
  return (
    <div className={`${styles.device} ${styles[world]}`} aria-label={`NEVER app Home screen in ${world} appearance`}>
      <div className={styles.rim}>
        <div className={styles.screen}>
          <div className={styles.wallpaper} aria-hidden="true" />
          <div className={styles.wallpaperShade} aria-hidden="true" />
          <div className={styles.status} aria-hidden="true">
            <span>9:41</span><span className={styles.statusMarks}>▂▄▆ <span>◕</span> ▰</span>
          </div>
          <div className={styles.island} aria-hidden="true" />
          <div className={styles.page}>
            <div className={styles.topBar}>
              <span className={styles.wordmark}>NEVER <i aria-hidden="true" /></span>
              <span className={styles.settings}><Icon name="settings" /></span>
            </div>
            <div className={styles.intro}>
              <span className={styles.eyebrow}>YOUR MEMORY</span>
              <strong>Good evening.</strong>
              <p>Everything worth remembering, ready when you need it.</p>
            </div>
            <div className={styles.ask}>
              <div className={styles.askMeta}><span className={styles.askGlyph}><Icon name="recall" /></span><span>RECALL WITH NEVER</span></div>
              <strong>Ask anything you’ve saved.</strong>
              <p>People, places, links, notes, plans — describe what you remember.</p>
              <div className={styles.askFooter}>Ask NEVER <span aria-hidden="true">›</span></div>
            </div>
            <div className={styles.capture}><span className={styles.capturePlus}><Icon name="plus" /></span><span>Capture something…</span></div>
            <div className={styles.shortcuts} aria-hidden="true">
              <div><span><Icon name="capture" /></span><small>Scan</small></div>
              <div><span><Icon name="recall" /></span><small>Link</small></div>
              <div><span><Icon name="resurface" /></span><small>Share</small></div>
            </div>
            <div className={styles.recent}>
              <div className={styles.recentHeading}>Recent memory <span>See All</span></div>
              <div className={styles.memoryRow}><span className={styles.memoryIcon}><Icon name="organize" /></span><span><b>Gift idea for Dad</b><small>Saved from Safari</small></span><i aria-hidden="true">›</i></div>
            </div>
          </div>
          <div className={styles.tabs} aria-hidden="true">
            <div className={styles.current}><Icon name="home" /><small>Home</small></div>
            <div><Icon name="recall" /><small>Search</small></div>
            <div><Icon name="calendar" /><small>Calendar</small></div>
            <div><Icon name="organize" /><small>Saved</small></div>
            <div><Icon name="settings" /><small>Settings</small></div>
          </div>
          <div className={styles.homeIndicator} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
