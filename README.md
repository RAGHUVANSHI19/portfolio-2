# Divyansh Raghuvanshi — Developer Portfolio

A dark Glassmorphism personal developer portfolio built for **Divyansh Raghuvanshi**, Computer Science Engineering (AI & ML) student at JECRC University, Jaipur.

![Portfolio Preview Banner](assets/favicon.svg)

---

## 💎 Design System & Highlights

- **Aesthetic**: Deep dark glassmorphism with subtle layered radial ambient glows.
  - Primary Background: `#070B14`
  - Secondary Surface: `#0B1220`
  - Glass Surfaces: `rgba(255, 255, 255, 0.04 - 0.08)` with `backdrop-filter: blur(16px)`
  - Accents: Electric Blue (`#3B82F6`), Cyan (`#22D3EE`), and Violet glow (`#8B5CF6`)
- **Brand Identity**: Custom **DR Monogram** avatar with rotating gradient ring, used consistently across the hero, sticky navigation bar, and favicon.
- **Honest Student Representation**: Highlights real academic background, technologies explored, and clean modular project slots ready for your showcase.
- **Tech Stack**: Vanilla HTML5, Vanilla CSS3 (modular design tokens & custom properties), and modern Vanilla JavaScript (no bloatware, zero runtime dependencies).

---

## 📂 Project Structure

```
portfolio pe/
├── assets/
│   └── favicon.svg           # Custom DR monogram vector favicon
├── css/
│   ├── variables.css         # Design tokens (colors, blur, typography, spacing)
│   ├── base.css              # Resets, ambient glows, container, typography
│   ├── components.css        # DR avatar, buttons, badges, glass cards, toast
│   ├── sections.css          # Navigation, hero, about, skills, projects, education, contact
│   ├── responsive.css        # Mobile (<768px), tablet (<1024px), reduced-motion
│   └── style.css             # Master stylesheet aggregator
├── js/
│   └── main.js               # Mobile drawer, active scroll spy, email copy toast, back to top
├── index.html                # Semantic HTML5 portfolio markup
├── package.json              # Local development scripts (Vite)
├── .gitignore                # Git ignore rules
└── README.md                 # Documentation & customization guide
```

---

## 🚀 Running the Project Locally

You can run the portfolio locally using either of the following methods:

### Method 1: Using the Dev Server (Recommended)
1. Install dev dependencies:
   ```bash
   npm install
   ```
2. Start the local development server:
   ```bash
   npm run dev
   ```
3. Open the provided local URL (typically `http://localhost:5173`) in your browser.

### Method 2: Direct Browser Launch (Zero-install)
Simply double-click `index.html` or open it directly in any modern browser (Chrome, Edge, Firefox, Safari).

---

## ✏️ Personalization Guide

All personal placeholders are clearly marked with comments in `index.html`:

1. **Email Address**:
   - In `index.html`, locate `id="contact-email-text"` and update `data-email` and the display text with your real email.
   - Also update the `href="mailto:..."` link in the contact CTA.
2. **LinkedIn Profile**:
   - In `index.html`, locate the LinkedIn card link `https://linkedin.com/in/your-profile-here` and replace it with your personal LinkedIn URL.
3. **Showcasing Projects**:
   - The `#projects` section is configured with clean glass cards and a placeholder slot.
   - Whenever you want to showcase a new project, you can tell your AI assistant or add a new `.project-slot-card` with your project title, description, technology tags, and GitHub repository link.

---

## 🌐 Publishing to GitHub

To publish this portfolio to your GitHub account (`RAGHUVANSHI19`):

```bash
# 1. Initialize git (if not already initialized)
git init

# 2. Add all files and make initial commit
git add .
git commit -m "feat: complete dark glass developer portfolio for Divyansh Raghuvanshi"

# 3. Create repository on GitHub named 'divyansh-portfolio'
# Then link remote and push:
git branch -M main
git remote add origin https://github.com/RAGHUVANSHI19/divyansh-portfolio.git
git push -u origin main
```

To enable **GitHub Pages**:
- Go to your repository **Settings** → **Pages**.
- Under **Build and deployment**, select `Deploy from a branch` and choose the `main` branch root (`/`).
- Your portfolio will be live at `https://raghuvanshi19.github.io/divyansh-portfolio/`!
