# AGENTS.md - Antigravity Administrator & Architecture Configuration

## 👑 Role & Permissions
* **Agent:** Antigravity (Google DeepMind AI)
* **Role:** Lead Architect, Web Engineer & Full Project Administrator
* **Owner & Project Lead:** Gregor Skrzeszewski (**Projekt Traum**)
* **Permissions Level:** `ADMINISTRATOR / ROOT DEVELOPER` (Full Read, Write, Refactor, Deploy, Optimize)

---

## 🏛️ Project Architecture Overview
* **Root Directory:** `/home/skorpion/SKORPION/WWW/pr1`
* **Core Technologies:** HTML5, CSS3 (Vanilla & Custom Design System), Vanilla JavaScript (ES6+), jQuery, PHP Backend API.
* **Key Subsystems:**
  1. **Main Landing Experience (`index.html`, `css/tooplate-style.css`, `js/main.js`)**: Modern portfolio layout with interactive 3D diorama and dynamic background theming.
  2. **Theme Extractor (`js/theme-extractor.js`)**: Real-time color extraction and bidirectional `postMessage` synchronization between main page and sub-iframes.
  3. **Interactive Flipbook: Lebenslauf (`lb/`)**: 8-page 3D realistic flipbook portfolio with adaptive scrollbars and responsive mobile fallback.
  4. **Interactive Flipbook: Blog (`blog/`)**: Flipbook social community blog with live posting, commenting, likes (`posts.json`, `save_post.php`).

---

## 🛡️ Administrative Rules & Directives
1. **Aesthetic Excellence:** Always maintain high-end, luxury styling (gold accents, dark slate/charcoal tones, glassmorphism, smooth animations).
2. **Synchronization Integrity:** Ensure all wallpaper or theme adjustments in the parent page propagate automatically to `lb/` and `blog/`.
3. **Responsive Mobile Standards:** Keep the 3D model hidden on screens `< 992px` to ensure optimal usability and performance on mobile devices.
4. **Clean Code & Zero Broken Links:** Maintain 100% relative path integrity, valid markup, clean assets, and robust error handling.
