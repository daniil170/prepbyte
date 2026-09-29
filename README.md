# PrepByte

> Adaptive web platform for students preparing for the Kazakhstan National Unified Testing (ENT / ҰБТ) in Computer Science.

---

## 📌 Project Overview

PrepByte provides an adaptive, interactive learning and assessment environment tailored to the Kazakhstan ENT Computer Science curriculum. It features modular question banks, simulated testing sessions, real-time analytics, and personalized knowledge reinforcement.

---

## 🛠 Tech Stack

- **Frontend Core**: React 19, JavaScript (ES6+)
- **Build Tooling**: [Vite](https://vite.dev/)
- **Routing**: [React Router](https://reactrouter.com/) (v7)
- **Backend & Services**: Firebase (Firestore, Authentication, Hosting)
- **Testing**: [Vitest](https://vitest.dev/), [@testing-library/react](https://testing-library.com/), [jsdom](https://github.com/jsdom/jsdom), [@testing-library/jest-dom](https://github.com/testing-library/jest-dom)
- **Code Quality**: ESLint (Flat Config with React and React Hooks rules), Prettier

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20+` (or `v26+`)
- **npm**: `v10+`

### Installation

```bash
git clone https://github.com/daniil170/prepbyte.git
cd prepbyte
npm install
```

### Environment Configuration

Copy the sample environment file to `.env`:

```bash
cp .env.example .env
```

Populate `.env` with your Firebase project credentials when ready (note: `.env*` files are strictly gitignored).

### Available Scripts

| Command           | Description                                                                |
| ----------------- | -------------------------------------------------------------------------- |
| `npm run dev`     | Starts the Vite local development server with Hot Module Replacement (HMR) |
| `npm run build`   | Builds the optimized production assets into `dist/`                        |
| `npm run preview` | Previews the production build locally                                      |
| `npm run lint`    | Runs ESLint across the codebase                                            |
| `npm run format`  | Formats code with Prettier according to `.prettierrc`                      |
| `npm test`        | Executes the Vitest test suite once                                        |

---

## 📂 Project Structure

PrepByte follows a **Feature-Driven Clean Architecture** to maintain high cohesion and low coupling:

```text
prepByte/
├── public/                 # Static public assets
├── src/
│   ├── app/                # Application root (App.jsx, router, providers, top-level pages)
│   ├── features/           # Domain-driven feature slices
│   │   ├── auth/           # Authentication feature
│   │   │   ├── data/       # Firebase & remote data source implementations
│   │   │   ├── domain/     # Pure business logic, models, and interfaces
│   │   │   ├── hooks/      # Custom React hooks coordinating UI and domain
│   │   │   └── ui/         # Feature-specific presentation components
│   │   ├── question-bank/  # Question database, filtering, catalog
│   │   │   ├── data/
│   │   │   ├── domain/
│   │   │   ├── hooks/
│   │   │   └── ui/
│   │   ├── testing/        # Exam simulations, timing, answer evaluation
│   │   │   ├── data/
│   │   │   ├── domain/
│   │   │   ├── hooks/
│   │   │   └── ui/
│   │   └── analytics/      # Performance metrics, score projections, history
│   │       ├── data/
│   │       ├── domain/
│   │       ├── hooks/
│   │       └── ui/
│   ├── shared/             # Cross-cutting reusable utilities & UI
│   │   ├── config/         # App constants, shared configs
│   │   ├── lib/            # Pure helper utilities
│   │   └── ui/             # Reusable UI components (buttons, modals, inputs)
│   ├── infrastructure/     # External infrastructure services
│   │   └── firebase/       # Firebase SDK initialization and client instances
│   ├── test/               # Vitest environment setup and test utilities
│   ├── index.css           # Global CSS reset and typography
│   └── main.jsx            # React root mount entrypoint
├── .env.example            # Template for environment variables
├── eslint.config.js        # ESLint flat configuration
├── jsconfig.json           # IDE path alias resolution
├── package.json            # Dependencies and npm scripts
├── vite.config.js          # Vite build, aliases, and Vitest configuration
└── README.md
```

### Absolute Path Aliases

Aliases are configured in both `vite.config.js` and `jsconfig.json`:

- `@app/*` -> `src/app/*`
- `@features/*` -> `src/features/*`
- `@shared/*` -> `src/shared/*`
- `@infrastructure/*` -> `src/infrastructure/*`

---

## 🏛 Architecture Rules

All contributors must adhere to the following architecture principles:

1. **Dependency Direction**:
   $$\text{ui} \longrightarrow \text{hooks} \longrightarrow \text{domain} \longleftarrow \text{data}$$
   - Presentation (`ui`) consumes custom React `hooks`.
   - `hooks` orchestrate actions between `domain` logic and `data` sources.
   - `data` provides implementations fulfilling domain contracts.
2. **Pure Domain Rule**:
   - Files within `*/domain/` must remain pure JavaScript.
   - **No** imports of React, hooks, JSX, or Firebase are permitted in `domain/`.
3. **Firebase SDK Isolation**:
   - The Firebase SDK is strictly imported only inside `src/infrastructure/firebase/` and `src/features/*/data/`.
   - Never import Firebase directly in UI components, hooks, or domain files.
4. **Component & Export Conventions**:
   - **One component per file**.
   - Use **named exports** for all non-page modules (components, hooks, utilities, domain functions).
   - Default exports are reserved for routed page components.
   - **No business logic in JSX**: Presentation components should remain declarative; derive state or trigger operations via hooks.

---

## 🌿 Git Workflow & Commit Guidelines

### Branching Strategy

- `main` is the production/stable branch. Direct commits to `main` are prohibited.
- Create topic branches from `main` using descriptive prefixes:
  - `chore/<task-name>`
  - `feat/<feature-name>`
  - `fix/<bug-name>`
  - `docs/<documentation-name>`
  - `refactor/<refactoring-name>`

### Commit Message Conventions

PrepByte enforces [Conventional Commits](https://www.conventionalcommits.org/):

- **Language**: English only.
- **Mood**: Imperative mood (e.g., `feat: add ...`, `fix: handle ...`, `chore: update ...`).
- **Subject line limit**: Maximum 72 characters.
- **Granularity**: Small, logical commits addressing one single concern per commit.
