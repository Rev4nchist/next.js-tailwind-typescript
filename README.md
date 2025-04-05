[![CodeGuide](/codeguide-backdrop.svg)](https://codeguide.dev)

# CodeGuide SpacetimeDB Starter Template

A modern web application starter template built with Next.js 14 (App Router), featuring authentication via [Clerk](https://clerk.com/) and a real-time backend/database powered by [SpacetimeDB](https://spacetimedb.com/).

This template provides a solid foundation with a pre-configured SpacetimeDB Rust module, automatic client-side bindings generation, and a basic UI example demonstrating interaction. **It has been enhanced with testing, improved structure, type safety, and automated code quality tooling.**

## Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Authentication:** [Clerk](https://clerk.com/)
- **Database/Backend:** [SpacetimeDB](https://spacetimedb.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **SpacetimeDB Module Language:** [Rust](https://www.rust-lang.org/)
- **Testing:** [Vitest](https://vitest.dev/), [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- **Schema Validation:** [Zod](https://zod.dev/) (for Environment Variables)
- **Linting:** [ESLint](https://eslint.org/)
- **Formatting:** [Prettier](https://prettier.io/)
- **Git Hooks:** [Husky](https://typicode.github.io/husky/), [lint-staged](https://github.com/okonet/lint-staged)

## Prerequisites

Ensure you have the following installed before starting:

1.  **Node.js:** Version 18 or later.
2.  **Rust Toolchain:** Includes `rustc` and `cargo`. Install from [https://www.rust-lang.org/tools/install](https://www.rust-lang.org/tools/install).
3.  **SpacetimeDB CLI:** Follow the instructions in Step 3 of "Getting Started" below.
4.  **Clerk Account:** Needed for authentication setup (see "Configuration").

*(Optional: Generated project documents from [CodeGuide](https://codeguide.dev/) can be placed in the `documentation/` folder for reference.)*

## Getting Started: Step-by-Step Setup

Follow these steps carefully to get the project running locally:

1.  **Clone the Repository:**
    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```

2.  **Install Node.js Dependencies & Setup Husky:**
    ```bash
    npm install
    # or yarn install / pnpm install
    # This will also automatically run the "prepare" script to set up Husky hooks.
    ```

3.  **Install SpacetimeDB CLI:**
    *   **Windows (PowerShell):**
        ```powershell
        iwr https://windows.spacetimedb.com -useb | iex
        ```
    *   **macOS/Linux:**
        ```bash
        curl -sSL https://install.spacetimedb.com | bash
        ```
    *   **Verification:** Open a *new* terminal/shell and run `spacetime --version`. If the command is not found, you might need to log out/in or manually add the SpacetimeDB installation directory (e.g., `~/.spacetimedb/` or `C:\Users\<user>\AppData\Local\SpacetimeDB`) to your system's PATH environment variable.

4.  **Set Up Environment Variables:**
    *   Copy the example file:
        ```bash
        cp .env.example .env
        ```
    *   Edit the `.env` file and add your Clerk API keys (see "Configuration" below).
    *   The SpacetimeDB variables (`NEXT_PUBLIC_SPACETIMEDB_URI` and `SPACETIMEDB_DB_NAME`) are pre-filled for local development and usually don't need changing initially.

5.  **Build Backend & Generate Frontend Bindings:**
    This crucial step compiles the Rust code and creates the TypeScript code needed for the frontend to interact with it. Run these commands from the project root:
    ```bash
    # 1. Build the Rust module
    cd spacetime_module && cargo build && cd ..

    # 2. Generate TypeScript client bindings
    spacetime generate --lang typescript --out-dir src/spacetimedb --project-path spacetime_module
    # Note: If `spacetime` command isn't found, use the full path from Step 3.
    ```
    *(You should see output indicating success and the creation of files in `src/spacetimedb`.)*

6.  **Run the Development Environment:**
    You need **two separate terminals** running concurrently:
    *   **Terminal 1: Start SpacetimeDB Instance:**
        ```bash
        # In the project root directory
        spacetime start
        # Note: If `spacetime` command isn't found, use the full path from Step 3.
        ```
        *(Wait for output indicating the server has started, e.g., "SpacetimeDB node is running...")*
    *   **Terminal 2: Start Next.js Frontend:**
        ```bash
        # In the project root directory
        npm run dev
        # or yarn dev / pnpm dev
        ```

7.  **View the Application:**
    Open your browser to [http://localhost:3000](http://localhost:3000). You should see the template running, allowing you to create and view "Resources".

## Configuration

### Clerk Setup
1.  Go to your [Clerk Dashboard](https://dashboard.clerk.com/).
2.  Create a new application or use an existing one.
3.  Navigate to "API Keys".
4.  Copy the **Publishable key** and set it as `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in your `.env` file.
5.  Copy the **Secret key** and set it as `CLERK_SECRET_KEY` in your `.env` file.

### SpacetimeDB Setup (Local)
The template uses the following defaults in `.env.example` for local development:
-   `NEXT_PUBLIC_SPACETIMEDB_URI=ws://localhost:3000`: Connects to the local instance started by `spacetime start`.
-   `SPACETIMEDB_DB_NAME=cosine_module`: The default name for the database module when run locally. If you deploy to SpacetimeDB Cloud (`spacetime publish`), you might use a different name.

## Environment Variables (`.env` file)

```env
# Clerk Authentication (Required - Validated on Startup)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxx # Replace with your key
CLERK_SECRET_KEY=sk_test_xxxxxx                # Replace with your key

# SpacetimeDB (Required - Validated on Startup)
NEXT_PUBLIC_SPACETIMEDB_URI=ws://localhost:3000 # Default for local dev
SPACETIMEDB_DB_NAME=cosine_module             # Default for local dev
```
*Note: Required environment variables are now validated on application startup using Zod (see `lib/env.ts`). The application will fail to start if required variables are missing or invalid.*

## Features

-   🔐 Authentication with [Clerk](https://clerk.com/)
-   🚀 Real-time Database/Backend with [SpacetimeDB](https://spacetimedb.com/)
-   🦀 SpacetimeDB Module written in [Rust](https://www.rust-lang.org/)
-   🎨 Modern UI with [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
-   🔄 Automatic Client Bindings Generation (`spacetime generate`)
-   📱 Responsive Design
-   ✅ Unit & Integration Testing Setup ([Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/))
-   🔒 Environment Variable Validation ([Zod](https://zod.dev/))
-   💅 Automated Linting & Formatting ([ESLint](https://eslint.org/), [Prettier](https://prettier.io/), [Husky](https://typicode.github.io/husky/), [lint-staged](https://github.com/okonet/lint-staged))
-   📂 Organized Project Structure (Features, UI, Layout, Hooks, Types, Lib)

## Project Structure

The project follows a structured approach for better organization and scalability:

```
<project-directory>/
├── app/                # Next.js app router pages & layouts
├── components/         # React components
│   ├── ui/             # Reusable presentational components (e.g., Shadcn UI)
│   ├── features/       # Feature-specific components (grouped by feature)
│   ├── layout/         # Page layout structure components (Navbar, Footer, Sidebar)
│   ├── auth/           # Authentication-related UI components
│   └── providers/      # Context providers (ThemeProvider, etc.)
├── hooks/              # Custom React hooks (reusable logic, e.g., useIsMounted)
├── lib/                # Shared libraries, utilities, and configuration logic
│   ├── env.ts          # Environment variable validation (Zod schema)
│   └── spacetimedb/    # Scaffold for future complex SpacetimeDB client logic
├── types/              # Shared TypeScript type definitions (interfaces, types)
├── utils/              # General utility functions (incl. SpacetimeDB connect helper)
├── public/             # Static assets (images, fonts, etc.)
├── src/
│   └── spacetimedb/    # Generated SpacetimeDB client bindings (DO NOT EDIT MANUALLY)
├── spacetime_module/   # SpacetimeDB Rust module source code
│   ├── src/
│   │   └── lib.rs      # Main Rust module logic (tables, reducers)
│   └── Cargo.toml      # Rust dependencies
├── documentation/      # Placeholder for project-specific docs (optional)
├── .husky/             # Husky Git hooks configuration (pre-commit)
├── .env.example        # Environment variable template
├── .env                # Local environment variables (ignored by git)
├── .eslintrc.json      # ESLint configuration
├── .gitignore
├── .prettierrc         # Prettier configuration
├── next.config.mjs     # Next.js configuration (imports lib/env.ts for validation)
├── package.json        # Node.js dependencies & scripts
├── postcss.config.mjs  # PostCSS configuration
├── tailwind.config.ts  # Tailwind CSS configuration
├── tsconfig.json       # TypeScript configuration
├── vitest.config.ts    # Vitest test runner configuration
└── vitest.setup.ts     # Vitest setup file (imports @testing-library/jest-dom)
```

**Key Directory Explanations:**
-   `components/`: Organized into subdirectories:
    -   `ui/`: Generic, reusable UI blocks.
    -   `features/`: Components specific to a feature domain (e.g., `profile/`, `chat/`).
    -   `layout/`: Structural components (wrappers, navigation, footer).
    -   `auth/`: Clerk/authentication related UI.
    -   `providers/`: React context providers.
-   `hooks/`: Contains custom React hooks to encapsulate reusable stateful logic (e.g., `useIsMounted`).
-   `lib/`: Houses shared logic modules. `env.ts` uses Zod for runtime environment variable validation. `spacetimedb/` is prepared for future complex client interactions.
-   `types/`: Central location for shared TypeScript interfaces and type aliases (e.g., `UserProfile`, `ApiResponse`).
-   `.husky/`: Contains Git hooks, currently a `pre-commit` hook managed by Husky.

## Enhanced Tooling & Workflow

### Testing
-   **Framework:** Vitest and React Testing Library are configured.
-   **Running Tests:** Use `npm run test` for a single run or `npm run test:watch` for interactive watch mode.
-   **Test Files:** Tests are typically co-located with the component or hook they test (e.g., `button.test.tsx` alongside `button.tsx`). Follow the `*.test.tsx` or `*.spec.tsx` naming convention.

### Linting and Formatting
-   **Tools:** ESLint and Prettier are configured for code quality and style consistency. The Tailwind CSS Prettier plugin is included.
-   **Automation:** Husky and lint-staged are set up to automatically lint and format staged files (`.ts`, `.tsx`, `.js`, `.jsx`, `.css`, `.md`, `.json`) **before** each commit. This ensures code consistency in the repository.
-   **Manual Checks:**
    -   Run `npm run lint` to check for ESLint issues.
    -   Run `npm run format` to format the entire project with Prettier.

### Environment Validation
-   The application now validates required environment variables on startup using the schema defined in `lib/env.ts`. If validation fails (e.g., missing `CLERK_SECRET_KEY`), the application will throw an error and exit, preventing runtime issues caused by misconfiguration.

## Development Workflow Notes

-   **Backend Logic:** Modify Rust code (tables, reducers) in `spacetime_module/src/lib.rs`.
-   **After Backend Changes:**
    1.  **Rebuild & Regenerate:** Repeat **Step 5** (Build Module & Generate Bindings) from "Getting Started". This is essential to update the backend logic and the frontend's view of it.
    2.  **Restart SpacetimeDB:** Stop (`Ctrl+C`) and restart the `spacetime start` process (Terminal 1) to load the newly built module.
-   **Frontend Logic:** Modify TypeScript/React code in `app/`, `components/`, `utils/`, etc. The Next.js dev server (Terminal 2) usually hot-reloads these changes automatically.
-   **Testing:** Write tests for new components and hooks. Run `npm run test` or `npm run test:watch` frequently.

## Contributing

Contributions to improve this template are welcome! Please feel free to submit a Pull Request.
