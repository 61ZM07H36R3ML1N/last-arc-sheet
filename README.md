# Last Arc: Tactics Analogue — Character Companion (respective rights belong to their respective holders) This was fan made, I am the sole dev on this. Succubus Publishing created the game

A fast, mobile-first Progressive Web App (PWA) character sheet and live table companion built for **Last Arc: Tactics Analogue** (Rules Cyclopedia v.03). Designed for in-person and hybrid game tables to replace paper tracking with automated rule mechanics, real-time math audits, and seamless VTT interoperability.

🎮 **Live App:** [last-arc.brianjamiel.dev](https://last-arc.brianjamiel.dev)

---

## ✨ Features

- **Break Gauge & Threshold Tracking:** Interactive 5-step Break Gauge tracker with automatic status penalty highlights and Fortitude-derived Break Threshold audits.
- **Exploding Dice Roller:** Native roller supporting standard checks and polyhedral dice that automatically trigger indefinite recursive rerolls on max face hits.
- **Defenses & Derived Vitals:** Live calculation of Reflex, Fortitude, Will, and Max HP/MP pools that scale dynamically with multiclass combinations, levels, and racial traits.
- **27-Skill Audit Engine:** Live check bonuses factoring in character level scaling, attribute modifiers, training badges, skill focus, and active Armor Check Penalties.
- **Equipment & Bulk Audit:** Catalog of standard weapons, shields, and armors with automated Bulk limits, strength scaling, and encumbrance penalties.
- **Foundry VTT Interoperability:** Two-way adapter engine allowing players to export and import character data directly to and from standard Foundry VTT Actor JSON schema.
- **Offline-First Table Play:** Built as a standalone PWA with persistent LocalStorage state caching so players can track characters without active Wi-Fi.
- **Player Journal & Notes:** Built-in Markdown-friendly session notes and quest tracker saved directly to the device.

---

## 🛠️ Tech Stack

- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS v4 (CSS-first `@theme` configuration)
- **State Management:** Zustand with LocalStorage persistence
- **PWA & Offline:** `vite-plugin-pwa` with automatic service-worker updates
- **Icons:** Lucide React
