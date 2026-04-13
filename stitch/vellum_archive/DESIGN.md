# Design System Strategy: The Tactile Editorial

## 1. Overview & Creative North Star: "The Digital Curator"
This design system rejects the clinical, "app-like" sterility of modern fintech. Instead, it draws inspiration from the high-end world of independent print magazines and bespoke stationery. Our Creative North Star is **"The Digital Curator"**: an experience that feels as though it was hand-assembled on heavy-weight cardstock.

We move beyond the "template" look by prioritizing **intentional asymmetry** and **tonal depth**. Rather than boxing content into rigid, centered containers, we use sweeping margins, oversized serif typography, and overlapping layers to create a sense of physical space. The goal is a "Warm Paper" aesthetic that feels cozy and inviting, yet speaks with the quiet confidence of a premium service.

---

## 2. Colors & Surface Philosophy
The palette is rooted in organic, earthy tones that mimic natural materials—cream, tan, olive, and sienna.

### The "No-Line" Rule for Layout
Standard UI relies on lines to separate sections. We do not. Designers are **prohibited from using 1px solid borders for primary sectioning**. Boundaries must be defined through background color shifts.
*   **The Transition:** A `surface-container-low` section sitting on a `surface` background is our primary method of separation. 
*   **Surface Hierarchy:** Use the tiers (Lowest to Highest) to create "nested" depth. Treat the UI like stacked sheets of fine paper. An inner container (e.g., a tipping form) should use a slightly higher tier (like `surface-container-highest`) to distinguish it from the background.

### Signature Textures & Glass
To avoid a "flat" digital feel, we introduce:
*   **Tonal Gradients:** For primary CTAs and hero backgrounds, use subtle linear gradients (e.g., `primary` to `primary-container`). This adds "soul" and depth that a flat hex code lacks.
*   **Softened Glass:** For floating elements like navigation bars or pop-overs, use semi-transparent surface colors (`#FAF7EE` at 80% opacity) with a `20px` backdrop-blur. This allows the warm cream background to bleed through, making the layout feel integrated.

---

## 3. Typography: Editorial Authority
Our typography is a dialogue between the artisanal (`Fraunces`) and the functional (`Inter` and `JetBrains Mono`).

*   **Display & Headlines (Fraunces):** Use these for moments of high impact—creator names, large tip amounts, and section headers. The soft curves of the serif convey warmth and "high-quality stationery."
*   **UI & Body (Inter):** Reserved for instructional text and navigation. It provides the "Confidence" in our aesthetic—highly legible and modern.
*   **Mono (JetBrains Mono):** Specifically for transactional data, hashes, and currency. This adds a layer of technical precision to the organic feel.

**Scale Philosophy:** We utilize a high-contrast scale. Display text should be unapologetically large (e.g., `display-lg` at 3.5rem) to anchor the page, while UI labels remain crisp and small.

---

## 4. Elevation & Depth: Tonal Layering
We eschew the standard "shadow-heavy" look of Material Design in favor of physical stacking.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section. This creates a soft, natural lift without the "dirty" look of grey shadows.
*   **Ambient Shadows:** If a floating effect is required (e.g., a modal), use a "Tinted Ambient Shadow." The shadow color must be a low-opacity version of our `on-surface` color (`#1C1C16` at 4-6%) with a massive blur (40px+). 
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, it must be a **Ghost Border**: use the `outline-variant` token at 20% opacity. **Never use 100% opaque, high-contrast borders.**

---

## 5. Components
Each component must feel like a tangible object.

*   **Buttons:**
    *   **Primary:** `primary` (#445328) background, `on-primary` text. No pill shapes; use an 8px radius.
    *   **States:** On press, apply a `scale(0.98)` transform for a haptic, "physical" feel.
*   **Cards:**
    *   **Style:** `surface-container` background with a 10px radius. 
    *   **Hover:** Transition the border to `outline-variant` (#C6C8BA) and apply a subtle 1px "Ghost Border." 
    *   **Constraint:** **No divider lines.** Use 24px–32px of vertical white space to separate card content.
*   **Input Fields:**
    *   6px corner radius. Use `surface-container-highest` for the field background to create a "pressed-in" look against the lighter card surface.
*   **Tip Chips:** 
    *   Used for quick-select amounts. Use `secondary-container` with `on-secondary-container` text. Avoid circles; maintain the rectangular 8px radius.
*   **Status Indicators:**
    *   **Success:** `primary-container` (Muted Olive) with high-contrast text.
    *   **Error:** `tertiary-container` (Burnt Sienna). These are earthy tones, not neon, keeping the "Warm Paper" vibe.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** embrace negative space. If a layout feels crowded, increase the spacing from 32px to 48px or 64px.
*   **Do** align serif headlines to the left to create a strong editorial "spine."
*   **Do** use `JetBrains Mono` for all currency ($) and numerical data to signal "platform reliability."

### Don't:
*   **Don't** use pill-shaped buttons. We are a "stationery" brand, not a "mobile-first tech" brand. Harder (but softened) corners feel more premium.
*   **Don't** use pure black (#000000). Use `on-surface` (#1C1C16) to maintain the warmth of the palette.
*   **Don't** use standard dividers. If you feel the need to "separate" two items, use a background color shift or a `16px` increase in padding instead.
*   **Don't** ever introduce a Dark Mode. This system is designed specifically for the tactility of light-reflecting paper.