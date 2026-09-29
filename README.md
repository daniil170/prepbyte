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

### Firebase Setup

1. **Create Project**: Open the [Firebase Console](https://console.firebase.google.com/) and create a new Firebase project (or use an existing one).
2. **Enable Authentication Providers**:
   - In the sidebar, navigate to **Build** > **Authentication**.
   - Under the **Sign-in method** tab, enable:
     - **Email/Password**
     - **Google** (configure the project support email).
3. **Register Web App**:
   - Go to **Project Settings** (gear icon) > **General**.
   - Under **Your apps**, click the web icon (`</>`) to register a web application.
   - Note the provided Firebase configuration keys.
4. **Configure Environment**:
   - Create a local environment file from the template:
     ```bash
     cp .env.example .env.local
     ```
   - Populate `.env.local` with your project's configuration values:
     ```env
     VITE_FIREBASE_API_KEY=your_api_key
     VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     ```
   - Real credentials belong _only_ in `.env.local`. `.env*` files are strictly gitignored to protect secrets.

### Available Scripts

| Command           | Description                                                                |
| ----------------- | -------------------------------------------------------------------------- |
| `npm run dev`     | Starts the Vite local development server with Hot Module Replacement (HMR) |
| `npm run build`   | Builds the optimized production assets into `dist/`                        |
| `npm run preview` | Previews the production build locally                                      |
| `npm run lint`    | Runs ESLint across the codebase                                            |
| `npm run format`  | Formats code with Prettier according to `.prettierrc`                      |
| `npm test`        | Executes the Vitest test suite once                                        |
| `npm run seed`    | Seeds questions to Firestore (supports `-- --dry-run`)                     |

---

## 📂 Project Structure

PrepByte follows a **Feature-Driven Clean Architecture** to maintain high cohesion and low coupling:

```text
prepByte/
├── public/                 # Static public assets (favicon, etc.)
├── src/
│   ├── app/                # Application root (App.jsx, router, providers, top-level pages)
│   │   ├── pages/          # Top-level routed views (HomePage, etc.)
│   │   ├── App.jsx         # Root app wiring
│   │   ├── providers.jsx   # Top-level context providers (AuthProvider)
│   │   └── router.jsx      # Route tree definition (protected & public routes)
│   ├── features/           # Domain-driven feature slices
│   │   ├── auth/           # Authentication feature
│   │   │   ├── data/       # Firebase data repository & mappers
│   │   │   ├── domain/     # Pure business logic, errors, and validation
│   │   │   ├── hooks/      # AuthProvider, useAuth hook
│   │   │   └── ui/         # AuthForm, LoginPage, RegisterPage, ProtectedRoute
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
├── eslint.config.js        # ESLint flat configuration (with architectural boundaries)
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

5. **Feature Public API Boundary**:
   - Every feature must expose its public contract strictly through its root `index.js` (`src/features/<feature-name>/index.js`).
   - Consumers outside the feature (`src/app/`, other features) must **only** import from `@features/<feature-name>`.
   - Deep imports into feature internals (e.g. `@features/auth/hooks/...`, `../../auth/...`) are strictly forbidden and enforced by ESLint.
   - Modules inside the feature may import from sibling internal modules using relative paths (`../domain/...`, `../data/...`).

### ESLint Architectural Import Boundaries

Import restrictions are automatically enforced by ESLint via `no-restricted-imports`:

- **Domain Layer (`src/features/*/domain/**`)**:
  - Forbidden: `react`, `react-dom`, `react-router-dom`, `firebase/*`, `@infrastructure/*`.
  - Forbidden: imports from sibling feature layers (`@features/*/data`, `*/hooks`, `*/ui`, `../data`, `../hooks`, `../ui`).
- **UI Layer (`src/features/*/ui/**`)**:
  - Forbidden: `firebase/*`.
  - Forbidden: direct imports from any data layer (`@features/*/data`, `../data`). All data interactions must go through hooks.
- **Application, Shared & Cross-Feature Layers**:
  - Forbidden: deep imports into features (`@features/*/*`, `../../<feature>/**`). Must consume from `@features/<name>`.
  - Forbidden: `firebase/*` (allowed strictly within `src/infrastructure/firebase/**` and `src/features/*/data/**`).

---

## 📚 Question Bank Feature

The question bank encapsulates ENT Computer Science questions, validation schemas, and Firestore data mapping.

### Question Entity Model

A valid Question object adheres to the following contract:

| Property         | Type                           | Description                                                                                 |
| ---------------- | ------------------------------ | ------------------------------------------------------------------------------------------- |
| `id`             | `string`                       | Unique document ID (e.g., `py-loop-001`)                                                    |
| `topic`          | `string`                       | Identifier matching one of the 12 ENT topics                                                |
| `questionText`   | `string`                       | Text of the question (supports markdown and code blocks)                                    |
| `options`        | `string[]`                     | 2 to 6 non-empty, unique answer choices                                                     |
| `correctAnswers` | `number[]`                     | Valid zero-based indices of correct options (`1` for single-choice, `≥ 2` for multi-choice) |
| `explanation`    | `string`                       | Detailed pedagogical explanation for answer review                                          |
| `difficulty`     | `'easy' \| 'medium' \| 'hard'` | Question difficulty level                                                                   |
| `version`        | `number`                       | Schema version (positive integer, default: `1`)                                             |

### Syllabus Topics

12 official ENT topics partitioned across 6 foundational areas:

1. **Python Programming**: `python_loops` (Loops & Conditions), `python_functions` (Functions & Data Structures)
2. **Databases & SQL**: `sql_queries` (SELECT, WHERE, ORDER BY), `sql_joins` (JOIN, GROUP BY)
3. **Computer Networks**: `network_protocols` (OSI & TCP/IP), `network_addressing` (IP Addressing & Subnets)
4. **Computer Architecture**: `cpu_memory` (CPU & Memory), `number_systems` (Number Systems & Boolean Logic)
5. **Spreadsheets**: `spreadsheet_formulas` (Formulas & Functions), `spreadsheet_charts` (Charts & Data Filtering)
6. **Information Security**: `security_basics` (Security Foundations), `cryptography_basics` (Encryption & Data Protection)

### Question Repository API

Exposed through `@features/question-bank`:

- `getQuestionById(id)`: Fetches a single question entity by ID from Firestore.
- `getQuestionsByTopics(topics)`: Fetches questions matching specified topic IDs, chunking queries into Firestore `in` batches (≤ 30 topics).
- `getAllQuestions()`: Fetches all questions from the Firestore `questions` collection.

---

## 🌱 Database Seeding

The seed dataset and script provide idempotent test data for development and testing.

### Running Dry-Run (Local & Offline)

Validates the full seed dataset against domain validation rules without requiring network access or Firebase credentials:

```bash
npm run seed -- --dry-run
```

Outputs topic distributions and confirms question validity.

### Seeding Live Firestore

To populate your Firebase Firestore database:

1. Obtain a Firebase service account private key JSON file from the [Firebase Console](https://console.firebase.google.com/) (**Project Settings** > **Service accounts** > **Generate new private key**).
2. Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/service-account.json"
npm run seed
```

The script writes documents to the `questions` collection using document IDs matching question IDs, executing idempotent batch writes in chunks of ≤ 500.

---

## 🔒 Firestore Security Rules

Firestore access control is defined in `firestore.rules`:

- **Collection `questions`**:
  - `read`: Allowed for authenticated users (`request.auth != null`).
  - `write`: Blocked for client SDKs (`allow write: false;`). Modifications must be made via the Admin SDK / seed scripts.
- **Default Rule**: Denies all operations (`read, write: false;`) for any other document paths.

### Deploying Security Rules

Security rules are configured in `firebase.json`. To deploy rules to Firebase:

```bash
npx firebase-tools deploy --only firestore:rules
```

_(Note: Target project selection via `firebase use <project-id>` will be finalized during the deployment stage.)_

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
