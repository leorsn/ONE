# NEVER — DESIGN BIBLE V5.3

**Status:** Canonical  
**Primary platform:** iOS / iPadOS  
**Design direction:** Native Platinum Minimalism  
**Brand principle:** Quiet intelligence.  
**Implementation source of truth:** `src/ui/appleV5.tsx`

---

## 01 — DESIGN VISION

NEVER soll sich nicht wie eine typische Productivity-, AI-, SaaS- oder No-Code-App anfühlen.

Die Oberfläche soll wirken wie eine hochwertige iOS-Anwendung, die selbstverständlich auf dem Gerät lebt:

**präzise, ruhig, privat, intelligent, hochwertig und funktional.**

Technologie soll nicht die Hauptrolle spielen. Der Nutzer soll seine Erinnerungen, Dokumente, Links, Termine und Informationen sehen – nicht das System, das sie verwaltet.

NEVER darf niemals wirken wie:

- ein Base44-/Lovable-Template
- ein generisches SaaS-Dashboard
- eine bunte AI-App
- ein futuristisches Neon-Produkt
- ein Karten-Showcase
- eine Web-App in einer iPhone-Hülle
- ein Crypto-, Gaming- oder Analytics-Interface

---

## 02 — CORE PRINCIPLES

### 2.1 Native first

Wenn iOS bereits ein gutes visuelles oder interaktives Muster besitzt, orientiert sich NEVER daran.

Bevorzugt:

- system grouped backgrounds
- native push transitions
- grouped lists
- SF-Symbol-artige Icons
- systemnahe Search Fields
- systemnahe Segmented Controls
- kompakte Navigation
- echte Inhaltsdichte statt Marketing-Whitespace

NEVER darf Markencharakter besitzen, aber nicht auf Kosten nativer Bedienbarkeit.

### 2.2 Quiet

Keine unnötigen Badges, Farben, Glows, Gradients oder Statusflächen.

Ein Element bekommt visuelles Gewicht nur, wenn seine Funktion dieses Gewicht verdient.

### 2.3 Dense enough to be useful

V5.3 ersetzt die frühere Regel „eher zu viel als zu wenig Raum“.

Whitespace bleibt wichtig, aber NEVER ist eine täglich genutzte Utility-App und kein Editorial-Landingpage-Layout.

Ziel:

- klare Scanbarkeit
- ausreichende Touch Targets
- kompakte Row-Höhen
- wenig leere Fläche ohne Funktion
- keine zehn Informationen gleichzeitig

### 2.4 Hierarchy over decoration

Hierarchie entsteht primär durch:

1. Typografie
2. Position
3. Spacing
4. Materialkontrast
5. erst danach Farbe

### 2.5 Product truth

Bei AI, OCR, Privacy, Sync, Billing und Security werden nur technisch belegte Aussagen gezeigt.

Keine Claims wie `end-to-end encrypted`, sofern dies nicht tatsächlich implementiert und geprüft ist.

---

## 03 — BRAND CHARACTER

NEVER ist:

**Calm · Precise · Private · Intelligent · Premium · Minimal · Useful**

NEVER ist nicht:

**Playful · Loud · Colorful · Cute · Futuristic · Gamified · Corporate**

Consumer-facing Brand Name:

**NEVER**

Campaign line:

**NEVER forget.**

Die Campaign line gehört zu Marketing- und Launch-Momenten, nicht auf jeden Produktscreen.

---

## 04 — V5.3 COLOR SYSTEM

Die tatsächlichen Werte in `src/ui/appleV5.tsx` sind verbindlich.

### Light Mode

| Token | Wert | Verwendung |
|---|---|---|
| Canvas | `#F2F2F7` | systemGroupedBackground-artiger Hauptcanvas |
| Surface | `#FFFFFF` | grouped list / content surface |
| Elevated | `#FFFFFF` | nur wenn echte Elevation nötig ist |
| Fill | `#E5E5EA` | selected state / stronger neutral fill |
| Fill Soft | `#E9E9ED` | Search, passive icon wells, subtle controls |
| Label | `#111113` | Primary text |
| Secondary | `#3C3C4399` | Secondary text |
| Tertiary | `#3C3C434D` | Metadata / placeholders |
| Separator | `#3C3C4324` | Hairline separators |
| Graphite | `#1C1C1E` | Primary neutral action |
| Chrome | `#70757D` | neutral premium accent |
| Chrome Soft | `#E5E5EA` | quiet accent fill |

### Dark Mode

| Token | Wert |
|---|---|
| Canvas | `#000000` |
| Surface | `#1C1C1E` |
| Elevated | `#2C2C2E` |
| Fill | `#2C2C2E` |
| Fill Soft | `#242426` |
| Label | `#FFFFFF` |
| Secondary | `#EBEBF599` |
| Tertiary | `#EBEBF54D` |
| Separator | `#54545899` |
| Graphite | `#F2F2F7` |
| Chrome | `#D1D1D6` |
| Chrome Soft | `#3A3A3C` |

### Functional colors

- Success: `#34C759`
- Danger Light: `#FF3B30`
- Danger Dark: `#FF453A`
- Warning: `#C5892F`

Functional colors werden nur für echte Zustände verwendet.

---

## 05 — STRICT COLOR RULES

NEVER besitzt keine klassische bunte Brandfarbe.

Die Markenwirkung entsteht aus:

**Platinum · Graphite · Chrome · Typography · Material Contrast**

Verboten:

- Royal Blue als Brandfarbe
- AI Purple
- Cyan
- Neon
- Regenbogen-AI-Effekte
- starke Gradients
- fake chrome gradients
- Glow-Effekte

---

## 06 — TYPOGRAPHY

Primary Typeface auf iOS:

**SF Pro / native Apple system typography**

Keine externe Schrift wird eingesetzt, wenn dadurch native Qualität verloren geht.

### Canonical hierarchy

- Large Screen Title: `32 / 36`, Weight `700`, leicht negatives Tracking
- Section Title: etwa `18 / 22`, Weight `700`
- Primary Row Title: etwa `15.5 / 19`, Weight `600`
- Body: `12.5–14`, Weight `400–500`
- Metadata: `10.5–12.5`
- Micro Labels: `8–11`, Weight `600–700`, positives Tracking erlaubt

Keine extremen 800/900-Weights außerhalb des kompakten NEVER-Wordmarks.

---

## 07 — NEVER WORDMARK

Der In-App-Wordmark ist kompakt und subtil.

Canonical V5.3:

- `13 pt`
- Weight `800`
- Letter spacing etwa `4.5`
- kleine neutrale Signalmarke

Der Wordmark soll nicht auf jedem Utility-Screen wiederholt werden.

Home und besondere Brand-Momente dürfen ihn prominent führen; Calendar, Saved, Settings und ähnliche Utility-Flows benötigen kein redundantes Branding über der Navigation.

---

## 08 — SPACING

Base unit:

**4 pt**

Häufige Schritte:

`4 / 8 / 12 / 16 / 20 / 24 / 32`

Canonical iPhone horizontal screen padding:

**20 pt**

Screen-to-section spacing ist typischerweise `16–24 pt`, nicht automatisch `32–48 pt`.

Rows dürfen kompakt sein, solange Touch Targets und Lesbarkeit erhalten bleiben.

---

## 09 — RADIUS SYSTEM

V5.3 reduziert die frühere Card-Rundung deutlich.

Canonical:

- Search Field: `11`
- Small icon wells: `9–12`
- Buttons: `13–14`
- Grouped Surface: `14`
- Tab Bar: `22`
- vollständig kreisförmige Controls nur dort, wo die Form semantisch passt

Keine omnipräsenten 18–24px Kartenradien.

Keine Bubble UI.

---

## 10 — SHADOWS & MATERIALS

Default:

**kein Shadow.**

Bevorzugt werden:

- Canvas/Surface-Kontrast
- Hairline Separators
- Fill States

Shadows nur, wenn das Element tatsächlich über Inhalt schwebt, z. B. die Tab Bar oder ein selected segment.

Keine:

- harten Drop Shadows
- Glassmorphism
- große Blur-Flächen
- Glows
- schwebenden Card-Stapel

---

## 11 — GROUPED SURFACES

`V5Group` ist die Standardoberfläche für zusammengehörige Rows.

Canonical:

- Surface: White / `#1C1C1E`
- Radius: `14`
- kein Standard-Border
- kein Standard-Shadow
- interne Hairline Separators

Wichtig:

Nicht jeder Contentblock wird zu einer Card.

Eine Seite mit fünf unabhängigen Cards ist fast immer ein Zeichen, dass die Informationsarchitektur vereinfacht werden sollte.

---

## 12 — ROWS

Canonical Row:

**optional Icon → Title/Metadata → Accessory/Chevron**

V5.3 Standardhöhe liegt typischerweise um `58–66 pt`.

Regeln:

- Titel ist primär
- Metadata maximal zwei Zeilen
- Status nur anzeigen, wenn er handlungsrelevant ist
- keine Badge-Sammlung
- keine parallelen konkurrierenden Buttons in einer normalen Row

---

## 13 — THUMBNAILS

Typische Content-Thumbnails:

- `40–48 pt`
- Radius `10–12`
- echtes Content-Material bevorzugen
- keine dekorativen Stockbilder

Originalbilder und Dokumente bleiben später aus dem Memory Detail erneut öffnbar.

---

## 14 — ICONS

NEVER verwendet `OneIcon` / SF-Symbol-artige Symbole.

Icons sind:

- monochrom
- dünn bis medium
- semantisch
- konsistent

Verboten:

- Emoji als funktionale Icons
- bunte Icon Packs
- cartoonartige Illustrationen

---

## 15 — BUTTONS

### Primary

- Graphite Background
- White Text im Light Mode
- kontrastinvertiert im Dark Mode
- etwa `44–48 pt` Höhe
- Radius `13–14`

### Secondary

- Fill / Fill Soft / transparent
- kein unnötiger Border

### Destructive

- Rot primär als Text/Icon
- rote Vollfläche nur bei echter finaler destructive confirmation

---

## 16 — SEARCH FIELD

V5.3 Canon:

- Höhe etwa `44 pt`
- Radius `11`
- `Fill Soft`
- Search/Ask icon links
- native wirkender Clear-Control rechts
- kein Shadow
- kein Blue Focus Ring

Search ist Utility, keine Hero Card.

---

## 17 — SEGMENTED CONTROL

V5.3 Canon:

- Container etwa `32 pt` hoch
- Radius `8`
- Fill Soft
- Selected Surface White / Surface
- minimaler selected shadow
- kein farbiger Brand-State

---

## 18 — TAB BAR

Die V5.3 Tab Bar ist die einzige bewusst schwebende globale Surface.

Canonical:

- Höhe `56 pt`
- Radius `22`
- kleiner Außenabstand
- Light: nahezu weiß und leicht transluzent
- Dark: nahezu `#1C1C1E`
- sehr geringer Shadow
- aktives Icon bekommt nur ein dezentes Fill-Soft-Well
- Label bleibt klein

Keine große Floating-Pill pro aktivem Tab.

Keine bunte Tab Bar.

---

## 19 — NAVIGATION & MOTION

Root Stack verwendet native Plattformanimationen (`animation: default`).

Keine globale Fade-Transition zwischen normalen Push-Screens.

Motion ist funktional und zurückhaltend.

Keine:

- Bounces
- Confetti
- große Zooms
- Marketing-Animationen in normalen Arbeitsflows

---

## 20 — HOME

Home ist die wichtigste Utility-Oberfläche.

Canonical Reihenfolge:

1. subtiler NEVER Brand Moment
2. Greeting / Primary Question
3. Ask NEVER Entry
4. Capture Composer
5. Today, sofern relevant
6. Recent
7. Needs Review, sofern relevant

Home darf nicht wie ein Dashboard mit KPI-Widgets wirken.

Der Screen soll innerhalb weniger Sekunden beantwortbar machen:

**Was muss ich heute wissen oder speichern?**

---

## 21 — CAPTURE

Capture folgt:

**Input → Interpretation → Review wenn nötig → Save**

NEVER formuliert, wo belastbar möglich:

- eine sinnvolle Überschrift
- einen knappen Kontext
- erkannte URLs
- strukturierte Fakten

Der Nutzer darf diese Vorschläge anschließend ändern.

Wichtig:

Unsichere Beträge, Händler, Termine oder andere consequential facts werden nicht still als Wahrheit übernommen.

---

## 22 — OCR / SCAN

Scan bewahrt das Original und macht es nach dem Speichern erneut zugänglich.

V5.3 Verhalten:

- Kamera-/Dateinamen wie `IMG_4821.JPG` sind keine akzeptablen finalen Titel, wenn brauchbarer OCR-Text existiert.
- brauchbare OCR-Zeilen dürfen als Titelvorschlag dienen.
- erkannte `http(s)`- und `www`-URLs werden als echte Links gespeichert.
- normaler Dokument-Scan darf direkt nach Saved gelangen, wenn nur Dokumenttyp und OCR-Titel betroffen sind.
- unsichere Beträge, Händler, Datum oder Zeit bleiben Review-Felder.

Visuell:

1. Original
2. Recognition Status
3. Structured Review
4. Storage/Privacy Information
5. Save

Keine „Magic AI“-Sprache.

---

## 23 — SHARE TO NEVER

Native Share und Scan verwenden dieselbe Capture-Semantik.

Ein geteilter Screenshot oder Link soll nicht wie ein zweites Produkt wirken.

Original, OCR, Titel, Kontext, URLs und Destination folgen denselben Regeln wie Capture/Scan.

---

## 24 — ASK NEVER

Ask NEVER ist kein generischer Chatbot.

Canonical Modell:

**Question → Grounded Answer → Sources**

Für Link-Fragen wird der tatsächliche gespeicherte Link zurückgegeben, wenn er im Memory vorhanden ist.

Keine endlosen Chat-Bubbles.

Keine erfundenen Quellen.

Wenn die gespeicherten Daten nicht reichen, sagt NEVER das klar.

---

## 25 — SEARCH

Search priorisiert:

**Relevanz > Dekoration.**

Resultate verwenden kompakte grouped rows und echte Content-Thumbnails.

Filter sind klein und neutral.

Keine große Filter-Pill-Landschaft.

---

## 26 — CALENDAR

Calendar bleibt neutral.

Unterschiede entstehen über:

- Punkte
- Typografie
- Zeit
- Labels

Nicht über bunte Category Colors.

Selected date darf Graphite sein.

---

## 27 — SAVED & DOCUMENTS

Saved ist die persistente Memory-Bibliothek.

Dokumente verwenden:

- Merchant/Title
- Dokumenttyp
- Datum
- optional Betrag
- echtes Original / Thumbnail

Documents soll sich eher wie ein intelligenter Memory-Bereich als wie ein technischer Dateimanager anfühlen.

---

## 28 — MEMORY DETAIL

Memory Detail ist die langfristige Quelle der Wahrheit nach dem Speichern.

Es muss ermöglichen:

- Titel bearbeiten
- Original erneut öffnen
- gespeicherte Links öffnen
- Datum/Zeit/Kategorie/Ort bearbeiten
- Kontext und Notizen bearbeiten
- Saved/Completed Status setzen
- Memory löschen

Hintergrund-Sync darf laufende, noch nicht gespeicherte Formulareingaben nicht still überschreiben.

---

## 29 — INBOX / NEEDS REVIEW

Needs Review zeigt nur Informationen, die eine Entscheidung benötigen.

Canonical Hierarchie:

**Title → Context → small status → optional one action**

Keine konkurrierenden Confidence-Badges, Source-Badges, Buttons und Chevrons gleichzeitig.

---

## 30 — SETTINGS

Settings orientiert sich stärker an iOS als an Marketing-UI.

- Large Title
- kleine Section Labels
- grouped rows
- Icon Wells
- Secondary Descriptions
- Chevron nur bei Navigation

Die Unterseiten Appearance, Notifications und Privacy verwenden dieselbe Systemlogik.

---

## 31 — PRIVACY

Privacy muss überprüfbar und nüchtern sein.

Canonical actions:

- Privacy Policy
- Terms
- Export Data
- Delete Account
- Support

Keine falschen Security Claims.

---

## 32 — MEMBERSHIP / PAYWALL

Paywall ist ruhig und transparent.

NEVER und NEVER AI werden ohne manipulative Ranking-Badges dargestellt.

Verboten:

- Countdown Timer
- Fake Discounts
- Fake `MOST POPULAR`
- künstliche Dringlichkeit
- manipulative Dark Patterns

Preis und Intro Offer kommen aus App Store / RevenueCat.

Apple bestimmt Intro-Offer-Eignung zum Kaufzeitpunkt; diese Einschränkung bleibt in der UI sichtbar.

---

## 33 — AUTH & ONBOARDING

Auth und Onboarding gehören zum Produkt und dürfen keine separate visuelle Generation bilden.

Sie verwenden:

- V5 Canvas
- V5 Wordmark
- ruhige Grouped Surfaces
- dieselbe Typografie
- dieselben neutralen Actions

Onboarding erklärt Produktnutzen statt technische Architektur.

---

## 34 — EMPTY STATES

Empty State:

1. kleines neutrales Icon
2. kurzer Titel
3. ein erklärender Satz
4. nur wenn nötig eine klare Action

Keine Illustrationsflut.

Keine Fake-Skeletons als permanenter Empty State.

---

## 35 — LOADING

Loading verwendet:

- kleinen Activity Indicator
- optional NEVER Wordmark bei App Bootstrap
- dezente Skeletons nur wenn wirklich nötig

Kein großes animiertes Logo bei normalen Aktionen.

---

## 36 — ERRORS

Fehlertexte sind:

**präzise · ruhig · handlungsorientiert**

Beispiel:

**Couldn’t save this yet. Try again.**

Nicht:

**ERROR 500 SYNC FAILED**

---

## 37 — HAPTICS

Haptics nur für:

- erfolgreiche Saves
- wichtige Selection
- destructive confirmations
- zentrale Capture Actions

Nicht bei jedem Tap.

---

## 38 — COPY STYLE

NEVER spricht kurz.

Beispiele:

- `Save anything.`
- `Ask NEVER.`
- `Find it again.`
- `Saved to NEVER.`

Keine generische AI-/SaaS-Sprache.

---

## 39 — AI LANGUAGE

NEVER behauptet nicht zu wissen, was nicht belegt ist.

Bevorzugt:

**I found this in your saved memories.**

oder:

**I couldn't find enough saved information to answer that.**

Antworten müssen aus den gespeicherten Memories ableitbar sein.

---

## 40 — LIGHT MODE PRIORITY

Light Mode bleibt die primäre Brand-Präsentation für:

- App Store
- Website
- Marketing
- Screenshots

Dark Mode ist trotzdem vollständig produktionsfähig und keine zweite visuelle Sprache.

---

## 41 — ABSOLUTE DESIGN BANS

In NEVER verboten:

- blaue Brand-Akzente
- violette AI-Gradients
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
- große Dashboard-KPI-Blöcke
- Template-Hero-Cards
- Cards für jeden einzelnen Abschnitt

---

## 42 — ACTIVE GENERATION RULE

Im Produktionsbaum existiert nur die aktive V5-Screen-Generation.

Verboten:

- neue `V3`-/`V4`-Screens
- parallele Legacy-Versionen eines aktiven Screens
- Route-Wrapper, die auf eine alte Generation zeigen

Canonical route implementations:

- Home → `HomeV5`
- Search → `SearchV5`
- Ask → `AskV5`
- Calendar → `CalendarV5`
- Saved → `SavedV5`
- Settings → `SettingsV5`

---

## 43 — SCREEN DENSITY RULE

Auf jedem Screen muss klar sein:

**Was ist hier das Wichtigste?**

Wenn fünf Elemente gleichzeitig Aufmerksamkeit verlangen, wird reduziert.

Wenn ein Screen gleichzeitig sehr viel leere Fläche und sehr kleine Nutzinformation besitzt, wird verdichtet.

---

## 44 — VISUAL HIERARCHY

Reihenfolge:

1. Primary information/action
2. Main content
3. Secondary metadata
4. Controls
5. System information

Nie umgekehrt.

---

## 45 — IMPLEMENTATION CHECK

Jeder Screen wird gegen diese sieben Punkte geprüft:

### A — Layout
Ist die Informationshierarchie eindeutig?

### B — Typography
Wirkt sie systemnah, ruhig und hochwertig?

### C — Color
Bleibt sie Platinum / Graphite / Chrome plus funktionale Statusfarben?

### D — Components
Verwendet der Screen V5-Komponenten statt eigener Legacy-Surfaces?

### E — Density
Ist er nützlich kompakt statt leer oder überladen?

### F — Native Quality
Fühlt sich Navigation, Search, Rows und Feedback wie iOS an?

### G — Product Truth
Zeigt der Screen ausschließlich reale Funktionen und Claims?

---

## 46 — DESIGN QA

Ein Screen gilt erst als fertig, wenn:

- [ ] native iOS hierarchy
- [ ] V5 palette
- [ ] no legacy blue/purple
- [ ] no template appearance
- [ ] V5 spacing/radius system
- [ ] Light + Dark readable
- [ ] relevant accessibility labels/states
- [ ] no unnecessary card/shadow
- [ ] functional behavior preserved or intentionally improved
- [ ] product claims technically true

---

## 47 — RELEASE QUALITY GATE

Designänderungen gelten erst als Release-Kandidat, wenn die NEVER Quality Pipeline grün ist:

- TypeScript
- lint
- automated tests
- release script checks
- Expo dependency check
- Expo Doctor
- native release/config checks
- web export
- clean checkout

Ein visueller Pass darf keine technischen Regressionen verdecken.

---

## 48 — FINAL DESIGN STATEMENT

**NEVER is not designed to look technological.**

It is designed to make technology disappear.

The user should see their memories, documents, plans and information.

Not the software managing them.

**NEVER forget.**
