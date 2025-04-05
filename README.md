[![CodeGuide](/codeguide-backdrop.svg)](https://codeguide.dev)

# CodeGuide SpacetimeDB Starter Template

A modern web application starter template built with Next.js 14 (App Router), featuring authentication via [Clerk](https://clerk.com/) and a real-time backend/database powered by [SpacetimeDB](https://spacetimedb.com/).

This template provides a solid foundation with a pre-configured SpacetimeDB Rust module, automatic client-side bindings generation, and a basic UI example demonstrating interaction.

## Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Authentication:** [Clerk](https://clerk.com/)
- **Database/Backend:** [SpacetimeDB](https://spacetimedb.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **SpacetimeDB Module Language:** [Rust](https://www.rust-lang.org/)

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

2.  **Install Node.js Dependencies:**
    ```bash
    npm install
    # or yarn install / pnpm install
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
# Clerk Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxx # Replace with your key
CLERK_SECRET_KEY=sk_test_xxxxxx                # Replace with your key

# SpacetimeDB (Defaults for local development)
NEXT_PUBLIC_SPACETIMEDB_URI=ws://localhost:3000
SPACETIMEDB_DB_NAME=cosine_module
```

## Features

-   🔐 Authentication with [Clerk](https://clerk.com/)
-   🚀 Real-time Database/Backend with [SpacetimeDB](https://spacetimedb.com/)
-   🦀 SpacetimeDB Module written in [Rust](https://www.rust-lang.org/)
-   🎨 Modern UI with [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
-   🔄 Automatic Client Bindings Generation (`spacetime generate`)
-   📱 Responsive Design

## Project Structure

```
<project-directory>/
├── app/                # Next.js app router pages
├── components/         # React components (UI)
├── utils/              # Utility functions (incl. SpacetimeDB connect)
├── public/             # Static assets (images, fonts, etc.)
├── src/                # Source files (non-page components, types)
│   └── spacetimedb/    # Generated SpacetimeDB client bindings (DO NOT EDIT MANUALLY)
├── spacetime_module/   # SpacetimeDB Rust module source code
│   ├── src/
│   │   └── lib.rs      # Main Rust module logic (tables, reducers)
│   └── Cargo.toml      # Rust dependencies
├── documentation/      # Placeholder for project-specific docs (optional)
├── .env.example        # Environment variable template
├── .env                # Local environment variables (ignored by git)
├── next.config.mjs     # Next.js configuration
├── package.json        # Node.js dependencies
└── tsconfig.json       # TypeScript configuration
```

## Development Workflow Notes

-   **Backend Logic:** Modify Rust code (tables, reducers) in `spacetime_module/src/lib.rs`.
-   **After Backend Changes:**
    1.  **Rebuild & Regenerate:** Repeat **Step 5** (Build Module & Generate Bindings) from "Getting Started". This is essential to update the backend logic and the frontend's view of it.
    2.  **Restart SpacetimeDB:** Stop (`Ctrl+C`) and restart the `spacetime start` process (Terminal 1) to load the newly built module.
-   **Frontend Logic:** Modify TypeScript/React code in `app/`, `components/`, `utils/`, etc. The Next.js dev server (Terminal 2) usually hot-reloads these changes automatically.

## Contributing

Contributions to improve this template are welcome! Please feel free to submit a Pull Request.
