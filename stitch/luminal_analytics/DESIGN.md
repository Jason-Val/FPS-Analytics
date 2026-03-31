# Design System Strategy: The Luminous Analyst

## 1. Overview & Creative North Star
The "Luminous Analyst" is a design system that rejects the sterile, "bootstrap" aesthetic of traditional dashboards in favor of a **High-End Editorial** experience. The Creative North Star is **"Atmospheric Precision."** 

We are not building a grid of boxes; we are crafting a layered environment of data. By utilizing intentional asymmetry—such as offset chart headers and varying card widths—we break the "template" look. We prioritize tonal depth over structural lines, ensuring the interface feels like an expensive, custom-tooled instrument rather than a generic SaaS product. High-contrast typography scales (Manrope for punchy headers, Inter for utility) create a rhythmic reading experience that guides the eye through complex datasets with ease.

---

## 2. Colors & Surface Logic
The palette is rooted in deep midnight tones (`surface: #06092f`), allowing vibrant analytical accents to pop with neon-like clarity.

*   **The "No-Line" Rule:** 1px solid borders are strictly prohibited for sectioning. Structural separation must be achieved through background shifts. For instance, place a `surface-container-low` component against the `surface` background to define its boundary.
*   **Surface Hierarchy & Nesting:** Treat the UI as physical layers.
    *   **Base:** `surface` (#06092f)
    *   **Sectioning:** `surface-container-low` (#090e38)
    *   **Primary Cards:** `surface-container` (#0f1442)
    *   **Active/Elevated Elements:** `surface-container-high` (#141a4c)
*   **The "Glass & Gradient" Rule:** Floating elements (modals, dropdowns) must use `surface-variant` (#1a2056) at 80% opacity with a `20px` backdrop-blur. Main CTAs should utilize a subtle linear gradient from `primary` (#89acff) to `primary-container` (#739eff) at a 135-degree angle to provide a sense of "visual soul."

---

## 3. Typography
We employ a dual-font strategy to balance editorial authority with functional clarity.

*   **Display & Headlines (Manrope):** Used for high-level metrics and page titles (`display-lg` to `headline-sm`). These should be set with tight letter-spacing (-0.02em) to feel bold and modern.
*   **Utility & Data (Inter):** Used for labels, body text, and tabular data (`title-lg` to `label-sm`). Inter’s high x-height ensures legibility in dense analytics.
*   **Visual Hierarchy:** Use `on-surface-variant` (#a4a8d5) for secondary labels to create a soft contrast against the vibrant `primary` (#89acff) headers.

---

## 4. Elevation & Depth
Depth is a functional tool, not a decoration. We move away from traditional shadows toward **Tonal Layering**.

*   **The Layering Principle:** To "lift" a chart, do not reach for a shadow first. Instead, place a `surface-container-highest` (#1a2056) card onto a `surface-container-low` (#090e38) background. The delta in luminance creates the lift.
*   **Ambient Shadows:** Use only for elements that physically overlap others (e.g., Popovers).
    *   **Spec:** `0px 20px 40px rgba(0, 0, 0, 0.4)`. The shadow must be tinted with the `background` color to ensure it feels like natural ambient occlusion.
*   **The "Ghost Border" Fallback:** If a chart requires a boundary for accessibility, use the `outline-variant` (#41456c) at **15% opacity**. This creates a "suggestion" of a container without breaking the fluid layout.

---

## 5. Components

### Cards (The Core Unit)
*   **Styling:** Use `rounded-xl` (1.5rem) for main dashboard cards.
*   **Content:** No dividers. Separate the "Header" from the "Data" using `spacing-6` (1.5rem) of vertical whitespace.
*   **Interaction:** On hover, shift the background from `surface-container` to `surface-container-high`.

### Primary Action Buttons
*   **Shape:** `rounded-full`.
*   **Color:** Gradient of `primary` to `primary-container`.
*   **Typography:** `label-md` (Bold).
*   **Padding:** `spacing-3` (vertical) by `spacing-6` (horizontal).

### Analytical Chips
*   **Filter Chips:** Use `surface-container-highest` with `on-surface` text.
*   **Selection State:** Transition to `secondary-container` (#591adc) with a `px` stroke of `secondary`.

### Data Inputs
*   **Field Style:** Minimalist. No bottom line or full box. Use a `surface-container-low` fill with `rounded-md`.
*   **Focus State:** A 2px "Ghost Border" using `primary` at 40% opacity and a subtle `primary` glow (4px blur).

### Specialized Analytics Components
*   **Legend Indicators:** Use `rounded-full` dots (8px) rather than squares for a softer, premium feel.
*   **Trend Micro-charts:** Use `tertiary` (#b5ffc2) for "up" trends and `error` (#ff716c) for "down," but apply a 10% opacity fill gradient below the line to anchor it to the baseline.

---

## 6. Do’s and Don'ts

### Do:
*   **Do** use asymmetrical layouts. A large `2/3` width chart next to a `1/3` width metric list creates a more dynamic, editorial feel than two equal boxes.
*   **Do** use `spacing-10` (2.5rem) or `spacing-12` (3rem) for major section gaps. Breathing room is a luxury signal.
*   **Do** leverage the `tertiary` (#b5ffc2) palette for "Success" states—the minty green feels more modern than a standard forest green.

### Don't:
*   **Don't** use 100% white (#FFFFFF) for text. Use `on-background` (#e3e3ff) to reduce eye strain in dark mode and maintain the blue-toned atmosphere.
*   **Don't** use dividers (`<hr>`). If you feel the need for one, you likely haven't used enough whitespace or a sufficient background color shift.
*   **Don't** use "Drop Shadows" on cards that are sitting on the base surface. Let the tonal shift of the `surface-container` tiers do the work. Only use shadows for "floating" UI like tooltips.