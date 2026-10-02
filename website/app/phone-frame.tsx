import { Icon } from "./icons";
import type { WorldId } from "./worlds";

export type NeverScreen = "home" | "search" | "saved" | "capture" | "calendar";

export function PhoneFrame({
  variant = "aurora",
  screen = "home",
  className = "",
}: {
  variant?: WorldId;
  screen?: NeverScreen;
  className?: string;
}) {
  return (
    <div className={`phone-frame phone-${variant} ${className}`} aria-label={`NEVER ${screen} preview`}>
      <div className="phone-metal" aria-hidden="true" />
      <div className="phone-bezel">
        <div className="dynamic-island" />
        <div className="phone-screen">
          <div className="phone-wallpaper" />
          <div className="phone-glass" aria-hidden="true" />
          <div className="phone-ui">
            <div className="phone-status">
              <span>9:41</span>
              <span className="phone-indicators"><i className="signal-bars" /><i className="battery" /></span>
            </div>

            {screen === "home" && (
              <>
                <div className="phone-brand">NEVER</div>
                <div className="phone-greeting"><small>YOUR MEMORY</small><h4>Good morning.</h4><p>What do you want to remember?</p></div>
                <div className="phone-ask"><small>NEVER AI · ASK</small><strong>Ask anything you saved.</strong><span>Search your memory →</span></div>
                <div className="phone-capture">Capture something <b>＋</b></div>
                <div className="phone-shortcuts"><span>Scan</span><span>Link</span><span>Share</span></div>
                <div className="phone-list"><small>TODAY</small><div><b>Flight confirmation</b><span>Tomorrow · 08:10</span></div><div><b>Gift idea for Dad</b><span>Saved from Safari</span></div></div>
              </>
            )}

            {screen === "search" && (
              <>
                <div className="phone-title">Ask NEVER</div>
                <div className="phone-search">Ask your memory</div>
                <div className="search-question">“What were the ideas I saved for Dad’s birthday?”<i className="cursor" /></div>
                <div className="search-answer"><small>FROM YOUR MEMORY</small><b>Three ideas saved</b><p>Leather weekender, vinyl reissue, dinner at the place near the Elbe.</p></div>
                <div className="phone-list compact"><small>SOURCES</small><div><b>Gift idea for Dad</b><span>Safari · 4 days ago</span></div><div><b>Restaurant note</b><span>Captured yesterday</span></div></div>
              </>
            )}

            {screen === "saved" && (
              <>
                <div className="phone-title">Saved</div>
                <div className="phone-filters"><span>All</span><span>Ideas</span><span>Travel</span></div>
                <div className="saved-grid"><div><span>TRAVEL</span><b>Lisbon weekend</b></div><div><span>IDEA</span><b>Dad’s birthday</b></div><div><span>DOC</span><b>Contract notes</b></div><div><span>LINK</span><b>Restaurant list</b></div></div>
              </>
            )}

            {screen === "capture" && (
              <>
                <div className="phone-title">Capture.</div>
                <p className="phone-subtitle">One small thing. All its context.</p>
                <div className="phone-capture-types"><span><Icon name="capture" />Scan</span><span><Icon name="phone" />Share</span><span><Icon name="plus" />Note</span></div>
                <div className="phone-review"><small>SCANNED DOCUMENT</small><div className="receipt-preview"><span>NEVER EXAMPLE</span><b>Café receipt</b><i /><p>2 × Coffee <span>€7.00</span></p><p>1 × Croissant <span>€3.50</span></p><strong>Total <span>€10.50</span></strong></div><div className="review-field"><span>Category</span><b>Food & drink</b></div><div className="review-field"><span>Source</span><b>Document scan</b></div><div className="phone-save">Review & save <Icon name="check" /></div></div>
              </>
            )}

            {screen === "calendar" && (
              <>
                <div className="phone-title">Calendar.</div>
                <p className="phone-subtitle">Dates, reminders and plans.</p>
                <div className="phone-calendar"><div className="calendar-date"><strong>9</strong><div><small>FRIDAY</small><b>October</b><span>2026</span></div></div><div className="calendar-days">{["T 8", "F 9", "S 10", "S 11", "M 12", "T 13", "W 14"].map((day, index) => <span className={index === 1 ? "selected" : ""} key={day}><small>{day.split(" ")[0]}</small><b>{day.split(" ")[1]}</b></span>)}</div><div className="calendar-modes"><span>Day</span><span>Week</span><span>Month</span></div></div>
                <div className="phone-list calendar-agenda"><small>TODAY</small><div><b>Flight confirmation</b><span>08:10 · Airport</span></div><div><b>Book Dad’s dinner</b><span>18:00 · Reminder</span></div></div>
                <div className="calendar-note"><Icon name="calendar" /><p>Your plans, connected to<br />the memories behind them.</p></div>
              </>
            )}

            <div className="phone-tabs"><span><Icon name="home" /><small>Today</small></span><span><Icon name="recall" /><small>Ask</small></span><span><Icon name="organize" /><small>Saved</small></span><span><Icon name="calendar" /><small>Calendar</small></span><span><Icon name="settings" /><small>More</small></span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
