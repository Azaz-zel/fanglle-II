---
name: The Fanglle II
description: A fictional Canggu superclub. One glass fang in the dark, one light that follows you, one gel per night.
colors:
  ink: "#07070A"
  surface: "#0F0F13"
  raised: "#17171C"
  line: "#3A3A43"
  line-soft: "#26262D"
  bone: "#ECE9E3"
  soft: "#BDB9B1"
  muted: "#8E8B85"
  work: "#F4F2EE"
  held: "#F0B55A"
  paid: "#6FD49A"
  error: "#FF8F8F"
  gel-thu-bright: "#9A93FF"
  gel-thu-deep: "#2B21B0"
  gel-fri-bright: "#F5AE4E"
  gel-fri-deep: "#B4600E"
  gel-sat-bright: "#FF6676"
  gel-sat-deep: "#A30F25"
  gel-sun-bright: "#F4A3C0"
  gel-sun-deep: "#9C3F66"
  door-let-in: "#0F6B38"
  door-stop: "#A3162F"
  door-check: "#C77A12"
typography:
  night:
    fontFamily: "Cormorant Garamond, Times New Roman, serif"
    fontSize: "clamp(44px, 10vw, 152px)"
    fontWeight: 300
    lineHeight: 1.02
    letterSpacing: "0.2em"
    textTransform: uppercase
  kicker:
    fontFamily: "Cormorant Garamond, Times New Roman, serif"
    fontSize: "clamp(20px, 1.9vw, 26px)"
    fontStyle: italic
    fontWeight: 400
  title:
    fontFamily: "Cormorant Garamond, Times New Roman, serif"
    fontSize: "clamp(30px, 3vw, 44px)"
    fontWeight: 400
    lineHeight: 1.08
  name:
    fontFamily: "Cormorant Garamond, Times New Roman, serif"
    fontSize: "22px"
    fontWeight: 400
  nav:
    fontFamily: "Jost, Helvetica Neue, Arial, sans-serif"
    fontSize: "11.5px"
    fontWeight: 500
    letterSpacing: "0.22em"
    textTransform: uppercase
  body:
    fontFamily: "Jost, Helvetica Neue, Arial, sans-serif"
    fontSize: "15.5px"
    fontWeight: 300
    lineHeight: 1.75
  label:
    fontFamily: "Jost, Helvetica Neue, Arial, sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
rounded:
  pill: "999px"
  square: "0"
spacing:
  gutter: "clamp(16px, 5vw, 80px)"
  section: "clamp(56px, 7vw, 104px)"
components:
  button-solid: { backgroundColor: "{colors.bone}", textColor: "{colors.ink}", rounded: "{rounded.pill}", height: "44px" }
  button-gel: { backgroundColor: "gel-bright of the night", textColor: "{colors.ink}", rounded: "{rounded.pill}", height: "44px" }
  button-line: { backgroundColor: transparent, textColor: "{colors.bone}", border: "{colors.line}", rounded: "{rounded.pill}" }
  input: { backgroundColor: "{colors.raised}", textColor: "{colors.bone}", border: "{colors.line}", rounded: "{rounded.square}", height: "48px" }
  ticket: { backgroundColor: "{colors.work}", textColor: "{colors.ink}", rounded: "{rounded.square}" }
---

# Design System: The Fanglle II

## Overview

**Creative North Star: "Sorot" (the spotlight)**

One object in the dark. A glass fang, photographed in grey, stands in a black room; the night's gel tints it, and a lamp follows the visitor's pointer so the fang only comes up where the light reaches. Changing nights is a cut through black: copy and object dip out fast, the gel changes in the dark, the next night comes up slower and its name settles in from wide tracking. Pages are slabs that stack: surface, black, then a block of the night's deep gel.

Luxury comes from restraint: a high-contrast serif in wide caps for names, a light geometric sans for everything you read or press, pills for controls only, square panels and fields, and motion that has a cause. There are no photos yet; the fang is the only image, and photo frames carry a labelled brief until the owner's photos arrive.

The same world runs through four regions. The public site (persuade) carries the lamp and the fang. The guest pass (offline) carries a halo of the gel over a white ticket. The manager panel (operate) keeps the gel to a glow at the head of the rail and the picked night's underline. The door (operate, dark and loud) keeps only the frame's sweeping line; speed and contrast beat look.

**Key characteristics:**
- One gel per weekday (Thursday violet, Friday amber, Saturday red, Sunday rose), one lit at a time, set by `gel-<day>` classes from the date (`gelOf`), never from a name
- The fang (`frontend/src/assets/fang.jpg`), one grey photograph tinted by `mix-blend-mode: color`, framed per place by a pose class (`hero`, `side`, `crown`, `tip`, `about`, `login`, `a0` to `a3`)
- The lamp: a dark sheet three times the room with a soft hole, moved on `transform` only, lerp 0.11 per frame; a tap jumps it; reduced motion parks it on the crown
- The pointer dot: a bone dot that stands up into a capsule over anything pressable, mouse only

## Colors

Near-black ink, bone text, four night gels. Gels light the object, the primary booking action, the rule under the first title, and "where you are" marks.

- **Ink #07070A** the page; **Surface #0F0F13** panels; **Raised #17171C** fields and pressed rows; **Line #3A3A43 / #26262D** hairlines
- **Bone #ECE9E3** 16.6:1 on ink; **Soft #BDB9B1** 10.3:1; **Muted #8E8B85** 5.9:1
- **Held / Paid / Error** state only, always with a word beside the dot
- **Block** `color-mix(in oklab, gel-deep 50%, ink)`, declared with each gel class so it follows the night. Muted is lifted to Soft inside it (Muted fails 4.5:1 on the amber block)
- **Work #F4F2EE** the QR ticket: the door scanner reads dark on light fastest

**Named rules**
- The gel marks the night, the one booking action on a screen (`btn gel`), and position; never a second action or decoration on controls
- Bone text on a gel surface sits on the deep gel sunk at least 70% into ink, never on the bright gel

## Typography

Cormorant Garamond (300 to 500, italic 400) and Jost (300 to 500), self-hosted in `public/fonts` and precached for the pass page.

- **Night**: Cormorant 300, caps, tracking 0.2em (0.14em under 860px). Names of nights and page titles
- **Kicker**: Cormorant italic 400, the line above a name (the date)
- **Title**: Cormorant 400, section titles, always followed by the short rule
- **Nav**: Jost 500, 11.5px caps, 0.22em, navigation only
- **Body**: Jost 300, 15.5px, line height 1.75, measure 58ch
- **Label**: Jost 12.5px, muted

**Named rules**
- Cormorant sets old-style figures; every display number uses `lining-nums` (a 0 must not read as an O)
- No em dash anywhere in interface copy

## Layout

Full-bleed slabs with a fluid gutter (`clamp(16px, 5vw, 80px)`), section padding `clamp(56px, 7vw, 104px)`. The header floats over the first room: logo left, nav centred, a pill pair right; under 900px a burger opens a full-screen sheet. Breakpoints 760px (phone) and 860px (columns stack). 360px wide without horizontal scroll.

## Shapes and depth

Pills are the only rounded shape (buttons, chips, steppers, the toggle). Panels, fields, photos, tables and the ticket stay square. Depth comes from light, not shadow: the only shadow is the manager's detail drawer.

## Motion

- **Settle**: names arrive at 0.42em tracking and pull in, 1.4s, `cubic-bezier(.23,1,.32,1)`, 250ms in, once
- **Rise**: 10px and fade, 800ms, staggered by `--i`
- **Cut through black**: out 220 to 240ms, in 420 to 520ms, CSS transitions so a second click retargets
- **Drift**: crops inside panels move 5% against the scroll via `animation-timeline: view()`, `translate` so the pose's transform stays
- **Door verdict**: one 180ms rise, nothing else; the camera frame's gel line is the door's only idle motion
- Reduced motion: no settle, rise or drift; the lamp parks; the dot hides; cuts become plain fades

## Components

- **Buttons** `btn solid | gel | line | quiet`, 44px pills; `btn danger` outlined in error
- **Go link** a hairline that grows into its gap on hover, then the words
- **Night tabs** (`swatch`): day, name in Cormorant, status; the chosen one gets a gel line that draws from the left
- **Lane**: hour by hour, every set a block on one axis from `laneOf` (F2 order); headliner on the sunk deep gel with a bright top line; a list on phones
- **Floor plan**: furniture from `venue_tables`; a gel pool slides to the chosen table
- **Fields**: square, raised, gel border on focus
- **Guest pass**: gel halo, kicker, night name, gel rule, white ticket with one sweep of light on open
- **Manager rail**: surface, gel glow at its head, current page marked by a gel inset line; nights as buttons underlined in their gel
- **Door result**: full-screen green, red or amber with the verdict in Cormorant 500 caps, never colour alone

## Do's and Don'ts

Do keep hours, prices and names from the API; tint the one fang rather than add images; give every status a word; keep `/door` fast and legible over pretty.

Don't put the gel on more than one action per screen; put bone text on a bright gel; round a panel; use a gradient wash, glassmorphism or a glow on controls; show a full phone number outside the manager's booking and guestlist lists (F14).
