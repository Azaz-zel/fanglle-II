---
name: The Fanglle II
description: A fictional Canggu superclub where every night of the week has its own light.
colors:
  blackout: "#0C0A0E"
  surface: "#16131A"
  raised: "#211D26"
  line: "#3A3441"
  line-soft: "#26212C"
  tungsten: "#F1ECE4"
  soft: "#CFC7BD"
  muted: "#9E968C"
  work: "#F7F3EC"
  ink: "#0C0A0E"
  held: "#F0B55A"
  paid: "#6FD49A"
  error: "#FF8F8F"
  gel-thu-deep: "#2B21B0"
  gel-thu-bright: "#9A93FF"
  gel-thu-haze: "#120F2B"
  gel-fri-deep: "#B4600E"
  gel-fri-bright: "#F5AE4E"
  gel-fri-haze: "#22140A"
  gel-sat-deep: "#A30F25"
  gel-sat-bright: "#FF6676"
  gel-sat-haze: "#210A0F"
  gel-sun-deep: "#9C3F66"
  gel-sun-bright: "#F4A3C0"
  gel-sun-haze: "#1F0F17"
  door-let-in: "#0F6B38"
  door-stop: "#A3162F"
  door-check: "#C77A12"
typography:
  night:
    fontFamily: "Big Shoulders Display, Arial Narrow, sans-serif"
    fontSize: "clamp(64px, 18.4vw, 264px)"
    fontWeight: 100
    lineHeight: 0.84
    letterSpacing: "-0.005em"
  headline:
    fontFamily: "Big Shoulders Display, Arial Narrow, sans-serif"
    fontSize: "clamp(44px, 5vw, 72px)"
    fontWeight: 300
    lineHeight: 1
  title:
    fontFamily: "Big Shoulders Display, Arial Narrow, sans-serif"
    fontSize: "34px"
    fontWeight: 200
    lineHeight: 1.05
  mark:
    fontFamily: "Big Shoulders Display, Arial Narrow, sans-serif"
    fontSize: "21px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.16em"
  body:
    fontFamily: "Albert Sans, Helvetica Neue, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Albert Sans, Helvetica Neue, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.12em"
rounded:
  sharp: "2px"
spacing:
  gutter-phone: "16px"
  gutter-desk: "64px"
  section: "140px"
  container: "1312px"
components:
  button-solid:
    backgroundColor: "{colors.tungsten}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sharp}"
    padding: "0 28px"
    height: "52px"
  button-solid-hover:
    backgroundColor: "#FFFDF8"
    textColor: "{colors.ink}"
  button-line:
    backgroundColor: "transparent"
    textColor: "{colors.tungsten}"
    rounded: "{rounded.sharp}"
    padding: "0 28px"
    height: "52px"
  button-small:
    padding: "0 18px"
    height: "44px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.soft}"
    rounded: "{rounded.sharp}"
    padding: "6px 14px"
    height: "44px"
  chip-pressed:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.tungsten}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.tungsten}"
    rounded: "{rounded.sharp}"
    padding: "0 16px"
    height: "52px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.sharp}"
    padding: "20px"
  ticket:
    backgroundColor: "{colors.work}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sharp}"
---

# Design System: The Fanglle II

## Overview

**Creative North Star: "Gel dan Kabut" (the gel and the haze)**

Every night of the week has its own light. A page is a hazy room washed by the gel of the night on stage: strongest at the rig at the top, falling away into blackout. Only one gel is lit at a time. Changing nights is a lighting cue, not a slide change: the text leaves, the crystals pan out of the room, the gel cross-fades, the next night's crystals pan in, and its name arrives letter by letter.

The controls are not part of the show. Buttons, fields and the ticket are lit by the work light (tungsten), never by the gel, so the colour on stage always means "which night" and never "click here". Luxury comes from restraint: thin tall type, sharp 2 px corners, near-black ground, and motion that has a cause. There are no photos yet; photo frames carry a labelled brief until the owner's photos arrive.

The same world runs through three regions. The public site (persuade) carries the full room. The guest pass (offline) carries a band of the night's room above a light ticket. The door scanner and the manager panel (operate) keep the gel as a thin accent and a single washed band; at the door, speed and contrast beat the look.

**Key Characteristics:**
- One gel per weekday (Thursday blue, Friday amber, Saturday red, Sunday rose), one on stage at a time
- Flat geometric crystal shards in three layers, one composition per night, idle drift and a pan cue between nights
- Big Shoulders Display at weight 100 for night names, Albert Sans for everything read
- Tungsten primary buttons; the gel never fills a control
- 2 px corners everywhere; the only round shapes are radio dots and status lights

## Colors

A near-black violet ground, warm tungsten text, and four night gels that light the room but never the controls.

### Primary
- **Tungsten** (`tungsten`): all primary text, the solid button, the tick of a checkbox. The work light of the venue.
- **Work light paper** (`work`): the guest ticket on the QR page, the only large light surface in the system.

### Secondary (the night gels)
Each night sets three values on its root class (`gel-thu`, `gel-fri`, `gel-sat`, `gel-sun`, chosen by `gelOf(date)` in night.js):
- **Deep** (`gel-*-deep`): the colour of the wash, the shards, headliner bars on the timeline, text selection.
- **Bright** (`gel-*-bright`): the lit accents: the Roman II in the mark, focus rings, selected swatch top edge, big numbers, the radio dot, guestlist cutoff marker.
- **Haze** (`gel-*-haze`): the floor of the room where the wash fades out.

These are registered with `@property`, so a change of night cross-fades the light over 900 ms.

### Tertiary (state)
- **Held amber** (`held`): a table held while the guest pays.
- **Paid green** (`paid`): a paid booking.
- **Error coral** (`error`): field errors and invalid borders.
- **Door results** (`door-let-in`, `door-stop`, `door-check`): full-panel LET IN, STOP and CHECK screens at the door, each with its own high-contrast text pair.

### Neutral
- **Blackout** (`blackout`): the ground of every page.
- **Surface** (`surface`) and **Raised** (`raised`): panels, fields, the selected swatch and selected mode card.
- **Line** (`line`) and **Soft line** (`line-soft`): borders and hairline dividers.
- **Soft** (`soft`) and **Muted** (`muted`): secondary text and labels. Muted is the floor for readable text on blackout.

### Named Rules
**The One Gel Rule.** Only one night's gel is lit on a screen. Other nights appear only as their swatch's thin top edge.

**The Work Light Rule.** Controls are tungsten or outline. A button filled with gel colour is a bug.

## Typography

**Display Font:** Big Shoulders Display (with Arial Narrow fallback), self-hosted, variable 100 to 600
**Body Font:** Albert Sans (with Helvetica Neue, Arial fallback), self-hosted, 400 and 500

**Character:** tall, thin, condensed caps like a beam of light, set against a calm humanist sans that does all the reading. Both fonts ship from `public/fonts` so the pass and the door keep their type without signal.

### Hierarchy
- **Night name** (100, clamp 64 to 264 px, line-height .84, uppercase): the name of a night on the hero, event page and pass band. On phones the size follows the name's length (`--chars`) so long names never break mid-word.
- **Headline** (300, clamp 44 to 72 px): section heads, page titles, dialogs.
- **Title** (200, 34 to 42 px): DJ names on the timeline, big counts.
- **Mark** (600, 21 px, .16em tracking, uppercase): THE FANGLLE with the II lit in the gel.
- **Body** (400, 16 to 17 px, line-height 1.5 to 1.6, max about 60ch): all copy, fields, buttons (buttons at 500).
- **Label** (500, 13 px, .12em tracking, uppercase, muted): kickers, field group names, column heads.

### Named Rules
**The Thin Beam Rule.** Display type is never heavier than 300 except the mark. No italics anywhere; `em` and `i` render upright.

## Layout

A single container of 1312 px with 64 px gutters on desk and 16 px on phone. Sections are separated by generous air (140 px) rather than boxes or alternating backgrounds. Hero rooms fill the first viewport (at least 640 px) and put the content in the bottom third, under the rig.

- Breakpoints: 760 px (phone to tablet), 900 px (the top menu unfolds), 1100 px (two-column flows collapse). The manager panel adds 640, 960 and 1100 px for its sidebar and grids.
- The night picker is always four equal columns, one per night, at every width. On phones the night names hide and the day and places carry it.
- Booking and guestlist flows are a form column with a sticky night card beside it on desk, the card dropping below the form on phone.
- The floor plan keeps its real proportions (1000 by 620) on desk; phones get a mini plan, zone tabs and table cards.
- No horizontal page scroll at any width. Wide manager tables scroll inside their own frame.

## Elevation & Depth

Flat. Depth comes from light, not shadow: the gel wash, a soft volumetric beam, a haze band, and three layers of crystals at different scales and opacities. There are no drop shadows on panels. The only shadow is a dark text halo on copy that sits over the lit room, so a bright shard passing behind a thin letter never takes it under 4.5:1.

Three light states only: lit (the gel room), dim (panels on blackout with gel hairlines), dark (blackout).

## Shapes

Sharp 2 px corners on every button, chip, field, card, badge, dialog and count. Crystals are flat triangles cut with `clip-path`, no bevels, gradients or fake glass. The only round shapes are the radio dot, the online status light and the door's ready light.

## Components

### Buttons
- **Shape:** sharp (2 px), 52 px tall, 44 px for the small size.
- **Solid:** tungsten fill, ink text, 500 weight. The single primary action on a screen.
- **Line:** transparent with a 38% tungsten outline; on hover the outline goes full tungsten with a faint fill.
- **Press:** scales to .97 in 160 ms. Disabled turns to a muted outline, never a faded gel.

### Chips and swatches
- **Chip:** outline, soft text; pressed state is raised fill with a gel-bright border. Used for filters and counts.
- **Night swatch:** a column with a thin top edge in that night's gel, day, name in display type, and places left. The selected night is raised with a full-strength edge.

### Cards and panels
- **Corner:** 2 px. **Background:** surface. **Border:** soft line. **Padding:** 20 px (panels on the public site go to 40 px).
- Panels below the hero stay dim; the gel shows only as hairlines and big numbers.

### Inputs and fields
- **Style:** surface fill, line border, 52 px tall, 17 px text, tungsten caret.
- **Focus:** 2 px gel-bright outline with 2 px offset, on any focus (scripts move focus to the first error).
- **Error:** coral border and a message under the field, linked with `aria-describedby`.
- **Checkbox and radio:** drawn in the house kit: a 2 px square with a tungsten tick, a ring with a gel dot.

### Navigation
- Public: the mark on the left, text links (This week, Gallery, About, Find my QR) at 15 px soft, a scrim band behind them so links hold contrast on any gel. Under 900 px the links fold into a Menu that opens a full-width list in display type.
- Manager: a dark sidebar in two groups (Tonight, Planning) with a gel-bright active edge and a tungsten count for held tables; on phones it becomes a scrolling top strip.

### Crystals (signature)
Three layers of flat shards per night, laid out deterministically from the night's key: Descent hangs from the rig, Second Wave alternates up and down, Fall Line runs on a diagonal with a white fall line, Afterglow is low converging beams on a white horizon. Idle: slow bob, sway and tilt, scaled by each shard's span, plus a glint pulse. Change of night: text out (260 ms), shards pan out (520 ms, front layer furthest), gel cross-fade (900 ms), new shards pan in (1000 ms, back layer first), name letters in (32 ms apart). With reduced motion, all of it becomes fades.

### Guest pass
A band of the night's room (seven shards, the night's name, doors time) above a light ticket: QR in ink on work-light paper, the entry code in Albert Sans 30 px with .16em tracking so it can be read out at the door.

### Door result
The whole left panel turns LET IN green, STOP red or CHECK amber, with a headline, the guest's name, kind and the last four digits of the phone, and one large action. Keyboard: 1 to 9 for people entering, Enter to let in, Esc to close.

## Do's and Don'ts

### Do:
- **Do** take the night's colours from its gel class (`gel-thu` to `gel-sun`) through `gelOf(date)`; never hard-code a gel hex in a component.
- **Do** keep primary buttons tungsten and secondary buttons outlined.
- **Do** use 2 px corners on every new box, badge or count.
- **Do** set night names in Big Shoulders Display 100, uppercase, and everything read in Albert Sans.
- **Do** give text over the lit room the dark halo (`room-in`) and dim crystals behind flow titles.
- **Do** honour `prefers-reduced-motion` in every new animation; fades only.
- **Do** keep photo frames as labelled briefs until the owner adds real photos.

### Don't:
- **Don't** fill a button, field or control with gel colour.
- **Don't** light two gels at once on one screen.
- **Don't** use drop shadows, glass blur, bevels or glow on panels; depth is light, not elevation.
- **Don't** use pill shapes or round corners above 2 px.
- **Don't** use italics, em dashes in interface text, or display type heavier than 300 outside the mark.
- **Don't** invent photos, testimonials, press or visitor numbers.
