# NEVER — DESIGN BIBLE v1.0

**Status:** Canonical  
**Purpose:** Verbindliche Grundlage für sämtliche NEVER-Oberflächen  
**Design Direction:** Platinum Minimalism  
**Primary Platform:** iOS / iPadOS  
**Brand Principle:** Quiet intelligence.

---

## 01 — DESIGN VISION

NEVER soll sich nicht wie eine typische Productivity-, AI- oder No-Code-App anfühlen.

Die visuelle Wirkung soll sein:

**präzise, ruhig, hochwertig, intelligent, privat und selbstverständlich.**

Die App darf niemals wirken wie:

- ein Base44-/Lovable-Template
- ein generisches SaaS-Dashboard
- eine typische bunte AI-App
- eine überladene Second-Brain-App
- ein futuristisches Neon-Produkt
- ein Gaming- oder Crypto-Interface

Die visuelle Referenz ist die zuletzt definierte App-Store-Serie:

**helles Platinum + Weiß + Graphit + dezentes Chrome.**

NEVER soll wie ein hochwertiges digitales Objekt wirken.

---

## 02 — CORE PRINCIPLES

### 2.1 Quiet

Die Oberfläche schreit nicht.

Keine unnötigen Badges, Farben, Verläufe oder Effekte.

Jedes Element muss einen Grund haben.

### 2.2 Spacious

Whitespace ist ein aktiver Bestandteil des Designs.

Inhalte dürfen nicht bis an jede Kante gedrückt werden.

NEVER soll eher zu viel als zu wenig Raum haben.

### 2.3 Editorial

Typografie und Hierarchie sind wichtiger als Dekoration.

Große Headlines.

Klare Untertitel.

Ruhige Informationsebenen.

Wenig visuelles Rauschen.

### 2.4 Native

NEVER soll sich auf dem iPhone wie eine hochwertige native Anwendung anfühlen.

Keine Web-App-Optik.

Keine unnötigen modalen Pop-ups.

Keine Desktop-Dashboard-Strukturen auf Mobile.

### 2.5 Trustworthy

Besonders bei AI, Privacy, OCR und Daten dürfen wir niemals Dinge behaupten, die technisch nicht wahr sind.

Keine Aussagen wie:

**“Encrypted end-to-end”**

solange dies technisch nicht tatsächlich implementiert und geprüft ist.

Marketing-Mockups dürfen keine falschen Produktversprechen in die echte App übertragen.

---

## 03 — BRAND CHARACTER

NEVER ist:

**Calm  
Precise  
Private  
Intelligent  
Premium  
Minimal  
Useful**

NEVER ist nicht:

**Playful  
Loud  
Colorful  
Cute  
Futuristic  
Gamified  
Corporate**

---

## 04 — COLOR SYSTEM

### LIGHT MODE — PRIMARY NEVER EXPERIENCE

Light Mode ist die visuelle Hauptreferenz.

#### Background

**Platinum Background**  
`#F1F3F5`

Verwendung:

- Hauptscreen
- große ruhige Flächen
- Hintergrund hinter Cards

#### Primary Surface

**Soft White**  
`#FAFBFC`

Verwendung:

- Cards
- Controls
- Navigationselemente
- Forms

#### Elevated Surface

**Pure White**  
`#FFFFFF`

Nur für leichte visuelle Erhöhung.

#### Soft Fill

`#ECEFF2`

Für:

- Tabs
- Search Fields
- passive Controls
- Secondary Buttons

#### Strong Fill

`#DDE1E5`

Für:

- selected states
- disabled surfaces
- stärkere Abgrenzungen

#### Primary Text

**Graphite**  
`#101214`

Keine reine schwarze Fläche als Standard.

#### Secondary Text

`#5D6268`

Für:

- Metadaten
- Descriptions
- Sekundärinformationen

#### Tertiary Text

`#8A9097`

Für:

- timestamps
- placeholders
- schwächere Labels

#### Border

`#D8DDE2`

Sehr dünn einsetzen.

#### Chrome

`#6E747B`

Für:

- Icon Highlights
- aktive neutrale Elemente
- dezente Premium-Akzente

#### Chrome Soft

`#EEF0F2`

#### Success

`#267A56`

Nur funktional.

#### Danger

`#B93F4B`

Nur für tatsächliche destructive actions.

#### Warning

`#9A6A24`

Nur bei echten Warnzuständen.

---

## 05 — DARK MODE

Dark Mode ist eine Übersetzung des Platinum-Systems, kein eigenes Neon-Design.

- Background `#080A0C`
- Surface `#111417`
- Elevated Surface `#171B1F`
- Fill `#1B2025`
- Strong Fill `#262C32`
- Primary Text `#F4F6F7`
- Secondary `#A7ADB4`
- Tertiary `#717880`
- Border `#2A3036`
- Chrome `#F2F4F5`

Keine blauen oder violetten Highlights.

---

## 06 — STRICT COLOR RULES

NEVER verwendet **keine Brand-Farbe im klassischen Sinne**.

Die Marke entsteht aus:

**Platinum  
Graphite  
Chrome  
Whitespace**

Verboten:

- Royal Blue
- AI Purple
- Cyan
- Neon
- starke Gradients
- Regenbogen-AI-Effekte
- Glow-Effekte

Farbe darf ausschließlich funktional eingesetzt werden:

Green = success  
Red = destructive/error  
Amber = warning

---

## 07 — TYPOGRAPHY

### Primary Typeface

Auf iOS:

**SF Pro / native Apple system typography**

Keine externe Schrift verwenden, wenn dadurch die native Qualität verschlechtert wird.

### Headline Character

NEVER Headlines:

- clean
- dünner als typische SaaS-Headlines
- großzügige Laufweite bei Brand-Elementen
- klare negative Letter Spacing bei großen UI-Headlines

Keine extrem fetten 800/900-Weights.

### Recommended hierarchy

#### Display / Marketing-style screen headline

28–34 pt  
Weight: 600–700  
Tracking: leicht negativ

#### Main Screen Title

26–30 pt  
Weight: 600–700

#### Section Title

17–20 pt  
Weight: 600–700

#### Card Title

14–16 pt  
Weight: 600–700

#### Body

13–15 pt  
Weight: 400–500

#### Metadata

11–13 pt  
Weight: 400–500

#### Micro Labels

9–11 pt  
Weight: 600–700  
Tracking: positiv möglich

---

## 08 — NEVER WORDMARK

Consumer-facing:

**N E V E R**

mit großzügigem Letter Spacing.

Der Wordmark soll nie:

- fett
- verspielt
- glänzend
- dreidimensional

sein.

Er soll eher wie ein hochwertiges Editorial-Label wirken.

---

## 09 — BRAND LINE

Canonical campaign line:

**NEVER forget.**

Verwendung:

- App Store
- Website
- Launch Material
- ausgewählte Brand-Momente

Nicht auf jedem App-Screen verwenden.

In der App selbst soll die Marke subtil bleiben.

---

## 10 — SPACING SYSTEM

Canonical base unit:

**4 px**

Wichtige Abstände:

`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48`

### Screen padding

iPhone:

**20 px horizontal**

Große Sections dürfen 24 px verwenden.

### Card spacing

Card-to-card:

**10–14 px**

Section-to-section:

**24–32 px**

---

## 11 — RADIUS SYSTEM

NEVER verwendet weiche, aber nicht cartoonartige Rundungen.

- Small controls: 10–12 px
- Buttons: 14 px
- Cards: 18–20 px
- Large hero surfaces: 20–24 px
- Circular controls: vollständig rund

Keine extremen 28–36 px „Bubble UI“-Cards überall.

---

## 12 — SHADOW SYSTEM

Shadows sind kaum sichtbar.

Ziel:

**Separation, nicht Floating UI.**

Keine:

- schwarzen harten Schatten
- Glow
- massive Floating Cards
- Glassmorphism

Bevorzugt:

- sehr geringe Opacity
- großer Blur
- minimale vertikale Verschiebung

Borders sind häufig besser als Schatten.

---

## 13 — CARDS

Canonical NEVER Card:

- Soft White
- Radius 18–20
- Hairline Border optional
- sehr subtile Elevation
- großzügiges Padding
- klare Hierarchie

Cards sollen nie fünf weitere Cards enthalten.

---

## 14 — LIST ITEMS

Ein typischer Memory-Eintrag besteht aus:

**Thumbnail / Icon → Titel → Metadata → optional Tag → More Action**

Keine unnötigen Statusbadges.

---

## 15 — THUMBNAILS

Thumbnails:

- 48–64 px
- Radius 10–14
- niemals überdominant
- echtes Content-Material bevorzugen

Dokumente dürfen leichte Preview-Karten zeigen.

---

## 16 — ICON SYSTEM

Icons:

- dünn
- monochrom
- SF-Symbol-artig
- konsistente Stroke Width

Keine bunten Icons.

Keine Emoji als funktionale Icons.

Keine cartoonartigen Illustrationen.

---

## 17 — BUTTONS

### Primary

Graphite Background  
Text: White  
Height: 48–52 px  
Radius: 14 px

### Secondary

Soft Fill / transparent  
Graphite text  
Border optional.

### Destructive

Keine rote Vollfläche im Normalzustand.

Red wird zurückhaltend verwendet.

---

## 18 — SEGMENTED CONTROLS

Reference:

Inbox  
Upcoming  
Saved  
All

Container:

Soft Fill

Selected:

White / Elevated

Selected state soll eher durch Elevation als durch Farbe entstehen.

---

## 19 — SEARCH

Search ist eine zentrale NEVER-Funktion.

Search Bar:

- 48–54 px hoch
- Soft White
- Radius 16–18
- Search Icon links
- Clear Control rechts
- dezente Shadow/Border
- kein Blue Focus Ring

Suchergebnisse erscheinen direkt darunter.

---

## 20 — NAVIGATION

Navigation bleibt funktional so, wie sie technisch für NEVER vorgesehen ist.

Die Design Bible erzwingt **keine Änderung der Informationsarchitektur**.

Visuell jedoch:

- hell
- ruhig
- keine große farbige Tab Bar
- aktive Icons Graphite
- inaktive Icons Grey
- subtile Labels

Keine große Floating Navigation.

---

## 21 — HOME / INBOX

Home ist die wichtigste Oberfläche.

Top:

NEVER Wordmark

Optional darunter sehr subtil:

**Capture today.  
Remember tomorrow.**

Dann:

Segmented Navigation

Danach:

Memories / Today / Inbox

Jede Card muss schnell scanbar sein.

Home darf niemals wie ein Dashboard mit 10 Widgets aussehen.

---

## 22 — CAPTURE

Capture soll sich wie intelligente Verarbeitung anfühlen.

Ablauf:

**Input → Recognition → Structured Information → Review → Save**

Strukturierte Details erscheinen in klaren Rows:

Title  
Date  
Time  
Location  
Category  
etc.

NEVER soll niemals den Eindruck erzeugen, dass AI unsichere Informationen automatisch als Wahrheit übernimmt.

---

## 23 — OCR / SCAN

Visuelle Referenz:

Screenshot 4 der App-Store-Serie.

Bild / Dokument oben.

Darunter:

**Recognized and organized**

Dann strukturierte Informationen.

AI-Status darf beispielsweise heißen:

**Analyzing…**

Nicht:

**MAGIC AI PROCESSING ✨**

---

## 24 — ASK NEVER

Ask NEVER ist **kein normaler Chatbot**.

Das Interface soll bewusst zeigen:

**Frage → Antwort → Sources**

Sources sind zentral.

Antworten müssen visuell mit Memories verbunden sein.

Keine endlosen Chat-Bubbles.

Keine ChatGPT-Kopie.

---

## 25 — SEARCH RESULTS

Query oben.

Darunter optionale Filter.

Result Cards können enthalten:

- title
- date
- source
- category
- thumbnail

Priorität:

Relevanz > visuelle Dekoration.

---

## 26 — CALENDAR

Calendar bleibt extrem sauber.

Keine bunten Event-Farben für jede Kategorie.

Events werden über:

- kleine Punkte
- Icons
- Labels
- Typografie

differenziert.

Der ausgewählte Tag darf Graphite sein.

---

## 27 — DOCUMENTS

Documents fühlen sich nicht wie ein Dateimanager an.

Filter:

All  
Receipts  
Tickets  
Travel  
Work  
etc.

Rows zeigen:

Preview  
Title  
Date  
File Type  
Category

Keine technische Dateisystemoptik.

---

## 28 — SETTINGS

Settings bleiben ruhig und hochwertig.

Sections:

Account  
Appearance  
Notifications  
Privacy  
Subscription  
Support

Jeder Eintrag:

Icon Tile  
Title  
Description  
Chevron

Keine endlosen iOS-Standardlisten ohne Markencharakter.

---

## 29 — PRIVACY

Privacy muss besonders vertrauenswürdig wirken.

Canonical actions:

Privacy Policy  
Terms  
Export Data  
Delete Account  
Support

Keine falschen Security Claims.

---

## 30 — PAYWALL

Paywall soll nicht aggressiv sein.

Headline:

klar und kurz.

NEVER und NEVER AI nebeneinander bzw. nacheinander.

Keine:

- Countdown Timer
- künstliche Rabatte
- Fake „MOST POPULAR“
- animierte Gold-Badges
- manipulative Dark Patterns

Preis aus App Store / RevenueCat.

Trial nur anzeigen, wenn tatsächlich vorhanden.

---

## 31 — EMPTY STATES

Empty States sind ruhig.

Beispiel:

**Nothing here yet.**

Kurzer erklärender Satz.

Eine klare Action.

Keine Illustrationsflut.

---

## 32 — LOADING

Loading:

kleiner Activity Indicator

oder dezente Skeletons.

Kein großes animiertes NEVER Logo bei normalen Aktionen.

---

## 33 — ERRORS

Fehlertexte:

präzise  
ruhig  
nicht technisch

Beispiel:

**Couldn’t save this yet.**

Try again.

Nicht:

**ERROR 500 SYNC FAILED.**

---

## 34 — MOTION

Motion ist subtil.

150–250 ms.

Verwendung:

- state transitions
- selection
- card appearance
- sheet transitions

Keine:

- bouncing
- confetti
- large zoom animations
- exaggerated spring motion

---

## 35 — HAPTICS

Haptics nur für:

- erfolgreiche Saves
- wichtige Selection
- destructive confirmations
- zentrale Capture Actions

Nicht bei jedem Tap.

---

## 36 — PHOTOGRAPHY / CONTENT

Content soll real und hochwertig aussehen.

Beispiele:

- Boarding Pass
- Restaurant Reservation
- Receipt
- Watch
- Travel Screenshot
- Document

Keine zufälligen Stock-Fotos.

---

## 37 — COPY STYLE

NEVER spricht kurz.

Beispiele:

**Save anything.**  
**Ask NEVER.**  
**Find it again.**  
**Captured.**  
**Saved to NEVER.**

Nicht:

“Leverage our intelligent AI-powered platform to effortlessly organize your digital life.”

---

## 38 — AI LANGUAGE

NEVER sagt nicht:

“I know…”

wenn die Antwort nicht ausreichend belegt ist.

Bevorzugt:

**I found this in your saved memories.**

oder:

**I couldn't find enough saved information to answer that.**

Design und Sprache müssen dieselbe Vertrauenswürdigkeit haben.

---

## 39 — LIGHT MODE PRIORITY

Für V1 gilt:

**Light Mode ist die zentrale Brand-Präsentation.**

Dark Mode muss hochwertig sein, aber Light Mode ist:

- App Store
- Website
- Marketing
- Screenshots
- visuelle Hauptidentität

---

## 40 — ABSOLUTE DESIGN BANS

In NEVER verboten:

- blaue Brand-Akzente
- violette AI Gradients
- Neon
- Glassmorphism
- große Blur-Flächen
- cartoonartige Illustrationen
- Emojis als UI
- übermäßige Pills
- übermäßige Badges
- große Drop Shadows
- 3D Buttons
- fake chrome gradients
- ständig animierte AI-Sparkles
- extreme font weights
- zu viele Cards
- große Dashboard-KPI-Blöcke
- Template-artige Hero Cards

---

## 41 — SCREEN DENSITY RULE

Auf jedem Screen muss klar erkennbar sein:

**Was ist das Wichtigste?**

Wenn fünf Elemente gleichzeitig Aufmerksamkeit verlangen, ist der Screen falsch gestaltet.

---

## 42 — VISUAL HIERARCHY

Reihenfolge:

1. Primary action / information
2. Main content
3. Secondary metadata
4. Controls
5. System information

Nie umgekehrt.

---

## 43 — APP STORE VISUAL REFERENCE

Die acht zuletzt erzeugten NEVER-App-Store-Mockups gelten als visuelle Referenz für:

- Spacing
- Platinum atmosphere
- typography character
- card treatment
- content density
- visual restraint
- brand feeling

Die Mockups sind **keine exakten funktionalen UI-Spezifikationen**.

Die bestehende App-Funktionalität bleibt maßgeblich.

Wir übernehmen die visuelle Sprache, nicht ungeprüfte Fake-Funktionen oder Fake-Claims.

---

## 44 — IMPLEMENTATION RULE

Bei jedem bestehenden Screen wird künftig geprüft:

### A. Layout

Stimmt die Informationshierarchie?

### B. Typography

Ist sie ruhig und hochwertig?

### C. Color

Nur Platinum / Graphite / Chrome?

### D. Components

Entsprechen Cards, Buttons und Inputs dem System?

### E. Density

Ist genug Whitespace vorhanden?

### F. Native Quality

Fühlt es sich wie eine echte iOS-App an?

### G. Product Truth

Zeigt der Screen nur Funktionen und Claims, die NEVER wirklich besitzt?

---

## 45 — DESIGN QA SCORE

Ein Screen ist erst fertig, wenn alle sieben Punkte erfüllt sind:

- [ ] Premium platinum visual language
- [ ] Clear hierarchy
- [ ] No legacy blue
- [ ] No generic template appearance
- [ ] Correct spacing/radius system
- [ ] Light + Dark readable
- [ ] Functional behavior unchanged or intentionally improved

---

## 46 — CANONICAL NEVER FEEL

Wenn ein neuer Screen gestaltet wird, lautet die Kontrollfrage:

**“Would this screen look natural inside the App Store campaign we approved?”**

Wenn nein:

der Screen ist noch nicht NEVER.

---

## 47 — FINAL DESIGN STATEMENT

NEVER is not designed to look technological.

It is designed to make technology disappear.

The user should see their memories, documents, plans and information.

Not the software managing them.

**NEVER forget.**
