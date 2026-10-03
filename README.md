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

| Command                  | Description                                                                     |
| ------------------------ | ------------------------------------------------------------------------------- |
| `npm run dev`            | Starts the Vite local development server with Hot Module Replacement (HMR)      |
| `npm run build`          | Builds the optimized production assets into `dist/`                             |
| `npm run preview`        | Previews the production build locally                                           |
| `npm run lint`           | Runs ESLint across the codebase                                                 |
| `npm run format`         | Formats code with Prettier according to `.prettierrc`                           |
| `npm test`               | Executes the Vitest test suite once                                             |
| `npm run test:rules`     | Runs Firestore Security Rules unit tests against local Firestore Emulator       |
| `npm run firebase:emulators` | Starts the Firebase Emulator Suite (Auth, Firestore, Functions, UI)         |
| `npm run firebase:seed`  | Seeds test accounts, groups, questions, and active exams into local emulators   |
| `npm run seed`           | Seeds questions to Firestore (supports `-- --dry-run`)                          |
| `npm run bank:audit`     | Audits question bank coverage, duplicates, and variant capacity                 |

---

## ⚡ Local Firebase Development & Emulator Suite

PrepByte provides a complete, isolated **Firebase Emulator Suite** setup so you can develop, test, and audit all features locally without connecting to or mutating production Firebase databases.

### 1. Local Services & Ports

The local environment runs the following Firebase services:
- **Authentication Emulator**: `http://127.0.0.1:9099`
- **Firestore Emulator**: `http://127.0.0.1:8080`
- **Functions Emulator**: `http://127.0.0.1:5001`
- **Emulator Suite UI**: `http://127.0.0.1:4000`

### 2. Quickstart Workflow

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Start the Firebase Emulator Suite**:
   ```bash
   npm run firebase:emulators
   ```
3. **Seed Development Data (in a separate terminal)**:
   ```bash
   npm run firebase:seed
   ```
4. **Start Frontend with Emulator Integration**:
   ```bash
   # Ensure VITE_USE_FIREBASE_EMULATOR=true is in your .env.local
   npm run dev
   ```

### 3. Pre-configured Local Test Accounts

The `firebase:seed` script initializes isolated test accounts with Custom Claims:

| Role | Email | Password | Custom Claims | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin@test.local` | `password123` | `{ "admin": true }` | System Administrator |
| **Teacher** | `teacher@test.local` | `password123` | `{ "teacher": true }` | Informatics Teacher (owns Group `10A`) |
| **Student 1** | `student1@test.local` | `password123` | `{}` | Student enrolled in Group `10A` |
| **Student 2** | `student2@test.local` | `password123` | `{}` | Student enrolled in Group `10A` |

**Pre-seeded Exam**: An active online exam with PIN `123456` is pre-seeded for testing student participation and server-authoritative submission.

> [!IMPORTANT]
> The seed script and test helpers check for local emulator environment variables (`FIREBASE_AUTH_EMULATOR_HOST` / `FIRESTORE_EMULATOR_HOST`) and will automatically abort if executed against production Firebase.

---

## 📂 Project Structure

PrepByte follows a **Feature-Driven Clean Architecture** to maintain high cohesion and low coupling:

```text
prepByte/
├── public/                 # Static public assets (favicon, etc.)
├── scripts/                # Database administration and audit CLI scripts
│   ├── audit/              # Bank audit CLI (auditBank.js)
│   └── seed/               # Question seed dataset and importer
├── src/
│   ├── app/                # Application root (App.jsx, router, providers, top-level pages)
│   │   ├── pages/          # Top-level routed views (HomePage, AdminVariantsPage, etc.)
│   │   ├── App.jsx         # Root app wiring
│   │   ├── providers.jsx   # Top-level context providers (AuthProvider, ThemeProvider)
│   │   └── router.jsx      # Route tree definition (protected & public routes)
│   ├── features/           # Domain-driven feature slices
│   │   ├── auth/           # Authentication feature
│   │   │   ├── data/       # Firebase data repository & mappers
│   │   │   ├── domain/     # Pure business logic, errors, and validation
│   │   │   ├── hooks/      # AuthProvider, useAuth hook
│   │   │   └── ui/         # AuthForm, LoginPage, RegisterPage, ProtectedRoute
│   │   ├── question-bank/  # Question database, similarity, admin generator
│   │   │   ├── data/       # Firestore question repository
│   │   │   ├── domain/     # Pure domain, topics, similarity, validation
│   │   │   ├── hooks/      # Hooks for variants and uploading
│   │   │   └── ui/         # Admin variants page, AI generator, dropzone
│   │   ├── testing/        # Exam simulations, novelty variant builder, timer
│   │   │   ├── data/       # Session & exposure repositories & mappers
│   │   │   ├── domain/     # Variant builder, scoring engine, session & exposure
│   │   │   ├── hooks/      # Session, coverage, timer, and testing provider
│   │   │   └── ui/         # TestPage, QuestionContent, Scratchpad, StartTestPanel
│   │   ├── analytics/      # Performance metrics, score projections, history
│   │   │   ├── data/       # Analytics repository
│   │   │   ├── domain/     # KPI calculator, mastery models
│   │   │   ├── hooks/      # Analytics hooks
│   │   │   └── ui/         # Dashboard widgets, mastery charts
│   │   └── tutor/          # AI ENT tutor feature slice
│   │       ├── data/       # AI client communication
│   │       ├── domain/     # System prompts, prompt builders, chat models
│   │       ├── hooks/      # useTutorChat hook
│   │       └── ui/         # TutorDrawer, message view
│   ├── shared/             # Cross-cutting reusable utilities & UI
│   │   ├── config/         # App constants, shared configs
│   │   ├── lib/            # Pure helper utilities (pluralize, chunk, etc.)
│   │   ├── theme/          # Light/dark theme provider and toggle
│   │   └── ui/             # Reusable UI components (buttons, modals, inputs)
│   ├── infrastructure/     # External infrastructure services
│   │   └── firebase/       # Firebase SDK initialization and client instances
│   ├── test/               # Vitest environment setup and test utilities
│   ├── index.css           # Global CSS reset, design tokens, typography
│   └── main.jsx            # React root mount entrypoint
├── .env.example            # Template for environment variables
├── eslint.config.js        # ESLint flat configuration (with architectural boundaries)
├── firestore.rules         # Security rules for questions, test_sessions, question_exposure
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

## 🎨 Design System & Brand Identity

PrepByte uses a dark developer/terminal-inspired aesthetic characterized by pure black backgrounds, high-contrast monospace typography, and subtle dot-matrix motifs.

### Design Tokens

Defined in `src/index.css` as CSS custom properties:

| Token                   | Value     | Purpose                                      |
| ----------------------- | --------- | -------------------------------------------- |
| `--color-bg`            | `#000000` | Canvas background                            |
| `--color-surface`       | `#0a0a0a` | Elevated surface/card background             |
| `--color-border`        | `#262626` | Subtle 1px structural borders                |
| `--color-border-strong` | `#404040` | Interactive border outlines                  |
| `--color-text`          | `#ffffff` | Primary text and solid highlights            |
| `--color-text-muted`    | `#a3a3a3` | Secondary labels, descriptions, and metadata |
| `--color-error`         | `#ff6b6b` | Error alerts and input invalid states        |
| `--radius`              | `4px`     | Border radius for controls and surfaces      |

### Typography

- **Monospace Stack (`--font-mono`)**: Self-hosted **JetBrains Mono** (weights 400 and 700 with latin and cyrillic subsets via `@fontsource/jetbrains-mono`), falling back to `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`. Used for logo, headings, buttons, tags, and inputs.
- **System Sans (`--font-sans`)**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`. Used for flowing body text and paragraphs.

### Background & Shape Language

- **Dot Matrix Grid**: Fixed 24px pure CSS radial dot grid with 5% white opacity on pure `#000000`.
- **Controls & Accessibility**: Sharp or slightly rounded corners ($\le 4\text{px}$), 1px solid borders, no box shadows, no gradients. Touch targets and inputs maintain a minimum height of 44px. Focus rings use high-contrast `:focus-visible` outlines.

### Logo Usage

The `Logo` component (`src/shared/ui/Logo/Logo.jsx`) renders the 12-cell matrix "P" mark on a 5x5 grid:

```jsx
import { Logo } from '@shared/ui/Logo/Logo';

// Mark only
<Logo variant="mark" size={24} />

// Full variant with wordmark
<Logo variant="full" size={28} />
```

### Brand Intro Animation

The `BrandIntro` component (`src/app/BrandIntro/BrandIntro.jsx`) renders a non-blocking animated intro overlay on top of the app:

1. **0.0s – 0.9s**: The 12 matrix cells scatter as binary `0`/`1` glyphs across the screen and converge into their grid positions.
2. **0.9s – 1.4s**: Glyphs snap to the 5x5 matrix and flip into solid white squares to form the "P" mark.
3. **1.4s – 2.4s**: The wordmark "PrepByte" resolves from random binary noise to real text via `scrambleText`, followed by a blinking terminal cursor.
4. **2.4s – 2.8s**: The overlay smoothly fades out and unmounts from the DOM.

#### Intro Rules & Replay:

- **Once Per Session**: The intro runs only once per browser session. Its completion is stored in `sessionStorage` under the key:
  ```text
  prepbyte_intro_shown
  ```
- **Replaying the Intro**: Open DevTools Application/Storage tab or console and run:
  ```javascript
  sessionStorage.removeItem('prepbyte_intro_shown');
  ```
  Then reload the page.
- **Skip Controls**: Pressing <kbd>Escape</kbd>, clicking anywhere on the overlay, or pressing any key instantly dismisses the intro.
- **Accessibility & Reduced Motion**: When `prefers-reduced-motion: reduce` is enabled in system settings, the animation is bypassed automatically without rendering the overlay.

### Light & Dark Theme Switching

PrepByte defaults to a dark developer terminal theme while supporting a crisp, high-contrast light theme:

- **State Management**: `ThemeProvider` and `useTheme` hook (`src/shared/theme/`).
- **DOM Integration**: Sets `data-theme="light"` or `data-theme="dark"` on the `document.documentElement` element, dynamically switching CSS token variables without layout shifts.
- **Persistence**: Remembers the student's theme preference in `localStorage` under `prepbyte_theme`.
- **Toggle Component**: Accessible `ThemeToggle` button rendered in the application header.

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
  - Forbidden: `@features/*` and cross-feature relative imports (`../../<feature>/**`, `../../*`). Domain must remain pure JS and must not import from any other feature (all dependencies/IDs are injected as plain data).
  - Forbidden: imports from own-feature data, hooks, or UI layers (`@features/*/data`, `*/hooks`, `*/ui`, `../data`, `../hooks`, `../ui`).
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

14 official ENT topics partitioned across 7 foundational areas:

1. **Python Programming**: `python_loops` (Loops & Conditions), `python_functions` (Functions & Data Structures)
2. **Databases & SQL**: `sql_queries` (SELECT, WHERE, ORDER BY), `sql_joins` (JOIN, GROUP BY)
3. **Computer Networks**: `network_protocols` (OSI & TCP/IP), `network_addressing` (IP Addressing & Subnets)
4. **Computer Architecture**: `cpu_memory` (CPU & Memory), `number_systems` (Number Systems & Boolean Logic)
5. **Spreadsheets**: `spreadsheet_formulas` (Formulas & Functions), `spreadsheet_charts` (Charts & Data Filtering)
6. **Information Security**: `security_basics` (Security Foundations), `cryptography_basics` (Encryption & Data Protection)
7. **Web Technologies**: `html_css` (HTML & CSS Fundamentals), `web_technologies` (Web Development & Client-Server Architecture)

### Question Repository API

Exposed through `@features/question-bank`:

- `getQuestionById(id)`: Fetches a single question entity by ID from Firestore.
- `getQuestionsByIds(ids)`: Fetches questions matching an array of IDs in chunks (preserving requested order).
- `getQuestionsByTopics(topics)`: Fetches questions matching specified topic IDs, chunking queries into Firestore `in` batches (≤ 30 topics).
- `getAllQuestions()`: Fetches all questions from the Firestore `questions` collection.
- `getQuestionCount()`: Fast, low-overhead count of total questions in the bank using Firestore `getCountFromServer`.
- `saveQuestionsBatch(questions)`: Idempotently upserts questions in batches of ≤ 500.

### Question Similarity & Bank Audit Domain

Pure domain algorithms in `src/features/question-bank/domain/questionSimilarity.js`:

- `normalizeQuestionText(text)`: Normalizes text by lowercasing, collapsing whitespace, and stripping code fence markers.
- `findExactDuplicates(questions)`: Groups question IDs by identical normalized text.
- `findNearDuplicates(questions, { threshold = 0.8 })`: Detects near-duplicate questions using Jaccard similarity over word 3-shingles.
- `auditBank(questions, { single = 30, multiple = 10 })`: Computes topic distributions, difficulty breakdowns, disjoint variant capacity, and missing question counts for 5 and 10 disjoint variants.

### Admin Variants & Document Import

The `/admin/variants` route provides an administrative workspace (`AdminVariantsPage`) supporting multi-format question import and AI generation:

#### Supported Ingestion Formats

1. **JSON Variants**:
   - Accepts standardized ENT variant JSON (`Array<Question>` or `{ questions: Question[] }`).
   - Validated against schema invariants via `validateVariantPayload`.

2. **DOCX & PDF Documents**:
   - Ingested and parsed entirely **in-browser** (zero server-side document transmission).
   - Parsing libraries (`mammoth` for DOCX, `pdfjs-dist` for PDF) are loaded dynamically via lazy chunks, keeping student bundles compact.
   - Normalizes text (`normalizeDocumentText`), segments question blocks (`parseQuestionBlocks`), extracts options and answers, and matches against existing questions in the bank for exact and near duplicate detection (`buildImportedQuestions`).
   - Interactive preview & editor (`QuestionPreviewEditor`) allows inline distractor edits, option additions/removals, topic/difficulty adjustments, and include/exclude selection before batch saving.

#### Expected Document Layout Example

Documents should follow standard exam layout conventions:

```text
1. Какой протокол обеспечивает надёжную доставку данных с установлением соединения?
A) UDP
B) TCP
C) ICMP
D) ARP
Ответ: B
Пояснение: Протокол TCP (Transmission Control Protocol) ориентирован на установление соединения и гарантирует доставку пакетов.

2. Выберите устройства ввода информации:
A) Монитор
B) Клавиатура
C) Мышь
D) Принтер
Ответ: B, C
Пояснение: Клавиатура и мышь передают данные в компьютер, тогда как монитор и принтер являются устройствами вывода.
```

_Note: Answer keys may also appear in a consolidated block at the end of the document, e.g.:_

```text
Ключи к тесту:
1-B, 2-BC, 3-A, 4-D
```

#### Duplicate Detection & Exclusion

- **Exact duplicates**: Questions with matching normalized text are flagged (`[ТОЧНЫЙ ДУБЛИКАТ]`) and excluded from import by default.
- **Near duplicates**: Questions with Jaccard 3-shingle similarity $\ge 80\%$ are highlighted with a warning badge (`[! ВНИМАНИЕ]`).
- **Bulk actions**: Administrators can quickly toggle inclusion with "Выбрать все" or "Исключить дубликаты".

#### Document Import Limitations

- **Scanned Documents (OCR)**: Files containing images of pages without a selectable text layer cannot be parsed; OCR is not supported.
- **Legacy `.doc`**: Binary `.doc` format is unsupported. Re-save as `.docx` in Word, LibreOffice, or Google Docs prior to uploading.
- **Embedded Images & Tables**: Diagrams, schematics, and complex nested tables are stripped during raw text extraction.
- **Matching Tasks (Соответствие)**: Matching tasks are not yet parsed as structured ENT questions; only standard single-choice and multiple-choice questions are ingested.
- **Two-Column PDF Layouts**: Highly customized multi-column PDF layouts may interleave text lines. Single-column layouts are strongly recommended.

#### ⚠️ Copyright & Content Policy

Import only pedagogical materials, tests, and mock exams that you have the explicit legal right, license, or authorization to use and distribute. Never import protected proprietary assessments without permission.

- **AI Variant Generator**: `AiVariantGenerator` generates ENT questions aligned with curriculum topics using prompt templates and structured JSON schema (`buildAiVariantPrompt`, `AI_VARIANT_JSON_SCHEMA`).

---

## 🌱 Database Seeding & Bank Audit

The seed dataset, importer, and audit tools ensure verified data integrity and test variant capacity.

### Current Bank Size

The question bank contains **119 verified questions** (89 single-answer, 30 multiple-answer) across all 14 ENT Computer Science topics:

- **Difficulty distribution**: ~26% easy, 54% medium, 20% hard.
- **Rich content**: 25+ questions feature fenced code blocks (Python, SQL, HTML/CSS) or algorithmic/mathematical computations.
- **Variant Capacity**: Supports 2 fully disjoint 40-question variants (limited by the 30 multiple-choice questions requiring 10 per variant).

### Modular Dataset Structure

The dataset is partitioned into per-group modules located in `scripts/seed/questions/`:

- `python.js`: `python_loops`, `python_functions`
- `databases_sql.js`: `sql_queries`, `sql_joins`
- `networks.js`: `network_protocols`, `network_addressing`
- `computer_architecture.js`: `cpu_memory`, `number_systems`
- `spreadsheets.js`: `spreadsheet_formulas`, `spreadsheet_charts`
- `information_security.js`: `security_basics`, `cryptography_basics`
- `html_css.js`: `html_css`, `web_technologies`
- `index.js`: aggregates all modules into `SEED_QUESTIONS`.

### Question Bank Audit CLI Tool

Audits the question bank for coverage, duplicate text, and variant generation limits:

```bash
# Audit seed dataset (offline, no credentials needed)
npm run bank:audit

# Enforce zero exact duplicates (fails with exit code 1 if duplicates exist)
npm run bank:audit -- --strict

# Audit live Firestore database
GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/service-account.json" npm run bank:audit -- --firestore
```

### Adding Questions & ID Conventions

When adding questions to a group module:

1. **ID Convention**: Follow topic prefixes: `py-loop-XXX`, `py-func-XXX`, `sql-q-XXX`, `sql-j-XXX`, `net-p-XXX`, `net-a-XXX`, `arch-cpu-XXX`, `arch-num-XXX`, `ss-form-XXX`, `ss-chart-XXX`, `sec-base-XXX`, `sec-crypto-XXX`, `web-html-XXX`, `web-tech-XXX`.
2. **Format Invariants**:
   - Single-answer: exactly 4 unique options, 1 correct index in `correctAnswers`. Balance correct answer position across A–D.
   - Multiple-answer: 5 or 6 unique options, 2 or 3 correct indices in `correctAnswers`.
   - Explanations must provide step-by-step reasoning for computations and explain why distractors are invalid.

### Factual Verification Policy (Execute, Do Not Guess)

Factual correctness is top priority in PrepByte. All questions must be verified by execution before inclusion:

- **Python**: Run snippets with `python3` and assert stdout/return values match options.
- **SQL**: Build in-memory tables in `sqlite3`, populate sample data, execute the query, and compare result sets.
- **IP Addressing & Subnets**: Compute network addresses, host counts, and broadcasts with Python's standard `ipaddress` module.
- **Binary/Hex & Logic**: Verify base conversions and boolean expressions with Python built-ins.
- **Theory**: Rely exclusively on standard RFCs, official specs, and established exam curriculum facts. Never guess.

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

---

## 📝 Testing & Exam Simulation Feature

The testing feature simulates official ENT Computer Science exams with balanced question variants, real-time countdown timers, autosave, and question navigation.

### Test Session Entity Model

Test sessions are persisted in the `test_sessions` collection:

| Property            | Type                                          | Description                                                          |
| ------------------- | --------------------------------------------- | -------------------------------------------------------------------- |
| `id`                | `string`                                      | Unique session UUID                                                  |
| `userId`            | `string`                                      | UID of the authenticated student                                     |
| `status`            | `'in_progress' \| 'completed' \| 'abandoned'` | Lifecycle state of the test attempt                                  |
| `questionIds`       | `string[]`                                    | Exactly 40 assembled question IDs ordered for this variant           |
| `answers`           | `Record<string, number[]>`                    | Map of question ID to array of selected zero-based option indices    |
| `flagged`           | `string[]`                                    | Question IDs bookmarked for review                                   |
| `currentIndex`      | `number`                                      | Zero-based index of the currently active question (0–39)             |
| `durationLimitSec`  | `number`                                      | Fixed time limit in seconds (3600 = 60 minutes)                      |
| `startedAt`         | `number \| Timestamp`                         | Epoch timestamp in milliseconds when test was initiated              |
| `finishedAt`        | `number \| Timestamp \| null`                 | Epoch timestamp in milliseconds when test completed                  |
| `updatedAt`         | `Timestamp`                                   | Server timestamp of the latest autosave                              |
| `score`             | `object \| null`                              | Exam score object (`totalPoints`, `maxPoints` [50], `byTopic`, etc.) |
| `questionSnapshots` | `object[] \| null`                            | Frozen question snapshots at completion for immutable review         |

### Key Mechanics

1. **One-Active-Session Rule**:
   - A student may have at most one active (`in_progress`) test session at any time.
   - Starting a new test variant executes an atomic batch write in Firestore that transitions any existing `in_progress` sessions for that user to `abandoned` status before creating the new session.
2. **Deadline-Based Timer (60 min / 40 questions)**:
   - Test duration is exactly 3600 seconds (60 minutes).
   - Remaining time is calculated directly from the absolute deadline ($\text{startedAt} + 3600000\text{ms}$), ensuring accurate countdown across page reloads, tab pauses, or device sleep.
   - When $\le 300\text{s}$ (5 minutes) remain, the timer enters a warning state with visual cues and a non-color indicator `[!]`.
   - Reaching zero immediately and automatically finalizes the session (`completed`).
3. **Autosave & Concurrency Guard**:
   - Answer selections, flags, and navigation changes trigger an autosave debounced by 800 ms.
   - Synchronous flush is dispatched on `visibilitychange` (`hidden`) and `pagehide` on a best-effort basis.
   - If network persistence fails, `saveState` indicates an error and retries automatically after 5 seconds.
   - Local monotonic version tracking ensures older in-flight network responses never overwrite newer local answers.
4. **Novelty-Aware Variant Builder**:
   - Assembles 40 questions while strictly preserving the official exam structure:
     - **Part 1 (Questions 1–30)**: 30 single-choice questions (1 point each).
     - **Part 2 (Questions 31–40)**: 10 multiple-choice questions (up to 2 points each, max 50 points total).
   - Questions for each section are selected using a **4-phase novelty algorithm**:
     - **Phase (a)**: Never-seen questions only, with a per-topic cap of $\lceil\text{quota} / \text{topics}\rceil + 1$, selected round-robin across shuffled topics.
     - **Phase (b)**: Never-seen questions with the per-topic cap relaxed.
     - **Phase (c)**: Seen questions ordered by least-seen (`timesSeen` ascending) and oldest (`lastSeenAt` ascending), with the per-topic cap.
     - **Phase (d)**: Seen questions with the per-topic cap relaxed.
   - Returns `{ questionIds, newQuestionCount }`. Ties are broken randomly.
5. **Per-User Exposure Tracking (`question_exposure`)**:
   - Persisted under `question_exposure/{userId}`: `{ userId, questions: { [questionId]: { timesSeen, lastSeenAt } } }`.
   - **Engaged vs Released Semantics**: On test start, all 40 questions are recorded in exposure. If a session is abandoned before completion, `releaseUnengaged` releases unengaged questions (questions where the student neither provided an answer nor toggled a flag) by decrementing their `timesSeen`. Only questions the student actually viewed/answered remain counted as seen.
   - **Backfill on First Start**: If an exposure document does not yet exist, `useStartTest` automatically reconstructs exposure from all past completed/abandoned sessions before assembling the variant.
   - **Resilience**: Exposure writes are strictly non-blocking (best-effort); exposure read failures fall back to `{}` so starting a test is never blocked.
   - **Bank Coverage Indicator**: `StartTestPanel` displays "Вы видели N из M вопросов банка". When $\text{unseen} < 40$, it informs the student that repeated questions in the next variant will be drawn from those seen longest ago.
6. **In-Test Scratchpad (`ScratchpadDrawer`)**:
   - Accessible from the test header for rough work, calculations, and logic truth tables during testing.
7. **Official Work Export (`TestWorkExportView`)**:
   - Formatted plain-text export for printing or saving test submissions with answer keys and explanations.

---

## 🤖 AI Tutor Feature

The AI tutor feature slice (`src/features/tutor/`) provides personalized, contextual assistance for students:

- **Tutor Drawer (`TutorDrawer`)**: Non-intrusive sliding panel available during question review.
- **Contextual Prompts**:
  - `buildMistakeReviewPrompt`: Focuses on explaining misconceptions for incorrectly answered questions without giving away answers immediately.
  - `buildCheatSheetPrompt`: Summarizes key ENT formulas, rules, and syntax for the relevant topic.
  - `buildCodeWalkthroughPrompt`: Provides line-by-line breakdown of algorithmic Python snippets and SQL queries.
- **Model Integration**: Structured communication layer (`sendTutorChatMessage`) formatting system prompts and conversation history for Gemini LLM endpoints.

---

## 🔒 Firestore Security Rules

Firestore access control is defined in `firestore.rules`:

- **Collection `questions`**:
  - `read`: Allowed for authenticated users (`request.auth != null`).
  - `write`: Blocked for client SDKs (`allow write: false;`). Modifications must be made via the Admin SDK / seed scripts.
- **Collection `test_sessions`**:
  - `read`: Restricted strictly to the session owner (`request.auth != null && resource.data.userId == request.auth.uid`).
  - `create`: Enforces user authentication, ownership matching (`request.resource.data.userId == request.auth.uid`), initial status `'in_progress'`, question count between 1 and 60, fixed `durationLimitSec == 3600`, and `answers` map type.
  - `update`: Permitted only to the document owner while the existing status is `'in_progress'`. Requires `userId`, `questionIds`, `startedAt`, and `durationLimitSec` to remain strictly immutable, while only allowing transitions to `'in_progress'`, `'completed'`, or `'abandoned'`.
  - `delete`: Strictly denied for client SDKs (`allow delete: if false;`).
- **Collection `question_exposure`**:
  - `read`: Restricted strictly to the authenticated exposure owner (`request.auth != null && request.auth.uid == userId`).
  - `create`: Enforces user authentication, ownership matching (`request.auth.uid == userId && request.resource.data.userId == userId`), and `questions` map type.
  - `update`: Permitted only to the authenticated owner with matching `userId` and `questions` map type.
  - `delete`: Strictly denied for client SDKs (`allow delete: if false;`).
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
