Perfect. I’ll prepare a detailed implementation plan you can follow in Cursor to integrate testing, improved structure, type safety, and consistency tooling into your Next.js + Tailwind + TypeScript + SpacetimeDB project.

I’ll walk through each of the seven points with step-by-step setup instructions, best-practice file structures, and minimal dependencies optimized for TSC/Next.js compatibility. I’ll also account for your existing ESLint/Prettier setup and keep SpacetimeDB logic minimal.

Give me a few moments to assemble this implementation blueprint.

# Integration Plan for Next.js 14 Template Improvements

Below is a step-by-step implementation plan to integrate all seven improvements into your Next.js 14 + Tailwind + TypeScript + SpacetimeDB project. Each section includes **actions**, code snippets, directory structure suggestions, and a brief **rationale** for why it's done that way. Follow these steps in order to refine the template.

## 1. Testing Setup (Vitest + React Testing Library)

1. **Choose a Test Runner –** Use **Vitest** for unit testing in this Next.js 14 project. Vitest is fast and built on Vite (which Next.js uses under the hood for dev), offering simpler configuration and native ESM support ([Vitest vs Jest - Which Should I Use for My Next.js App? - Wisp CMS](https://www.wisp.blog/blog/vitest-vs-jest-which-should-i-use-for-my-nextjs-app#:~:text=1)). It’s compatible with Jest’s API and works well with TypeScript. (Note: Neither Vitest nor Jest yet support *async* Server Components testing ([Testing: Vitest | Next.js](https://nextjs.org/docs/app/building-your-application/testing/vitest#:~:text=,components)), so focus tests on Client Components or synchronous logic for now.)

2. **Install Testing Dependencies –** Add Vitest, React Testing Library, and related packages as dev dependencies: 

   ```bash
   npm install --save-dev vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom vite-tsconfig-paths
   ``` 

   This installs Vitest, the Vite React plugin (for JSX/TSX support), JSDOM (browser-like environment), React Testing Library, and a plugin to honor TypeScript path aliases ([Testing: Vitest | Next.js](https://nextjs.org/docs/app/building-your-application/testing/vitest#:~:text=To%20manually%20set%20up%20Vitest%2C,following%20packages%20as%20dev%20dependencies)).

3. **Configure Vitest –** Create a **`vitest.config.ts`** in the project root with the following content:

   ```ts
   // vitest.config.ts
   import { defineConfig } from 'vitest/config';
   import react from '@vitejs/plugin-react';
   import tsconfigPaths from 'vite-tsconfig-paths';

   export default defineConfig({
     plugins: [react(), tsconfigPaths()],
     test: {
       environment: 'jsdom',  // Simulate browser environment for DOM APIs
       globals: true,         // Use global expect, describe, it without importing
       setupFiles: ['./vitest.setup.ts'],
     },
   });
   ```

   *Rationale:* This config uses the Vite React plugin and TS config paths plugin so Vitest can resolve aliases like `@/` correctly ([Testing: Vitest | Next.js](https://nextjs.org/docs/app/building-your-application/testing/vitest#:~:text=import%20,paths)). The `jsdom` environment enables DOM testing, and `globals: true` allows using `expect`/`it` without imports, matching Jest’s style.

4. **Setup Test Utilities –** Create a **`vitest.setup.ts`** file in the project root to import Jest matchers for DOM:

   ```ts
   // vitest.setup.ts
   import '@testing-library/jest-dom';
   ```

   This ensures functions like `toBeInTheDocument()` are available in tests (from `@testing-library/jest-dom`).

5. **Update TypeScript Config –** In your **`tsconfig.json`**, add Vitest types so the globals are recognized. For example: 

   ```json
   {
     "compilerOptions": {
       // ... other options ...
       "types": ["vitest/globals", "jest-dom"], 
       "baseUrl": "src"
     }
   }
   ```

   This registers Vitest and Testing Library types. Also ensure `baseUrl` (if using) is set (e.g. `src`) so the `vite-tsconfig-paths` plugin works for absolute imports.

6. **Define Test File Structure –** Organize your tests in a hybrid approach for clarity:
   - **Co-located tests:** For components and hooks, create test files next to the implementation (e.g. `Button.test.tsx` alongside `Button.tsx`). This keeps tests near the code they verify.
   - **Dedicated tests folder:** If needed for integration or broader tests, use a top-level `tests/` directory (e.g. for testing pages or complex flows). For now, you can start with co-located tests in the `components` or `hooks` folders, which Vitest will pick up by the `.test.ts(x)` naming convention.
   - Vitest by default looks for `*.test.*` or `*.spec.*` files. You can adjust the pattern in the config if needed.

7. **Add a Sample Test –** Create a simple test to verify the setup (using a Test-Driven Development style of expect-first). For example, if you have a `Button` component in `components/ui/Button.tsx`:

   **File:** `components/ui/__tests__/Button.test.tsx` (or colocate as `Button.test.tsx`):

   ```tsx
   import { render, screen } from '@testing-library/react';
   import Button from '@/components/ui/Button';

   describe('Button component', () => {
     it('renders with given text', () => {
       // Arrange & Act
       render(<Button label="Click me" />);
       // Assert
       expect(screen.getByText('Click me')).toBeInTheDocument();
     });
   });
   ```

   Then run `npm run test` to ensure it passes (or fails then passes after implementing). This sample follows the Arrange-Act-Assert pattern clearly, which aligns with TDD principles (write the assertion, ensure it fails if component is not implemented, then implement the component to make it pass).

8. **Add NPM Scripts –** In your **`package.json`**, add a test script for convenience:

   ```json
   {
     "scripts": {
       // ... other scripts ...
       "test": "vitest run",
       "test:watch": "vitest"
     }
   }
   ```

   Now you can run `npm run test` for a one-time run or `npm run test:watch` during development for TDD feedback.

**Rationale:** Setting up a proper testing environment early ensures you can write reliable tests for components and utilities. We chose Vitest due to its speed and modern features (fewer dependencies and faster execution than Jest ([Comparing Next.js testing tools and strategies - LogRocket Blog](https://blog.logrocket.com/comparing-next-js-testing-tools-strategies/#:~:text=Blog%20blog,uses%2026MB%20of%20disk%20space))) and official Next.js support (with examples for Next 13/14). Co-locating tests with code makes maintenance easier, while React Testing Library encourages testing components from the user’s perspective (e.g. querying rendered output). This provides confidence in our code without needing a full browser or manual testing.

## 2. Component Organization (UI, Features, Layout, Auth)

Restructure the `components/` directory into logical sub-folders to enforce separation of concerns and improve discoverability. Implement the following:

1. **Create Subdirectories –** Under `src/components/` (or `components/` root), create these folders:
   - **`ui/`** – For reusable presentational components (buttons, form inputs, modals, etc.). These are generic UI building blocks.
   - **`features/`** – For feature-specific components grouped by domain or feature. Each subfolder represents a feature or module of the app, containing components (and maybe sub-components) related to that feature. *(Example: an e-commerce app might have a `components/features/cart/` folder containing `Cart.tsx`, `CartItem.tsx`, `CartSummary.tsx`, etc. ([Next.js 14 Project Structure: Best Practices](https://nextjsstarter.com/blog/nextjs-14-project-structure-best-practices/#:~:text=Organize%20components%20by%20feature%20or,folder%20with)).)*
   - **`layout/`** – For layout components that structure pages, such as navigation bars, footers, sidebar, or Next.js layout wrappers. These components orchestrate page structure but are not the page content themselves.
   - **`auth/`** – For authentication-specific UI (login forms, signup forms, auth modals, or maybe OAuth buttons). Grouping these in `auth` makes it easy to locate all auth-related components.

2. **Move/Name Components –** Relocate existing component files into the appropriate folders. Use clear naming conventions:
   - Components should be **PascalCase** (e.g. `SignUpForm.tsx`, `Navbar.tsx`).
   - File name should match the component name for clarity.
   - Within each feature folder, you might have an `index.tsx` if the folder itself represents a composite component or section.
   - Example structure after reorganization:

     ```plaintext
     src/components/
     ├─ ui/
     │   ├─ Button.tsx
     │   ├─ Input.tsx
     │   └─ Modal.tsx
     ├─ layout/
     │   ├─ MainLayout.tsx
     │   ├─ Navbar.tsx
     │   └─ Footer.tsx
     ├─ auth/
     │   ├─ LoginForm.tsx
     │   └─ SignupForm.tsx
     └─ features/
         ├─ profile/
         │    ├─ ProfileCard.tsx
         │    └─ EditProfileForm.tsx
         └─ chat/
              ├─ ChatWindow.tsx
              ├─ MessageList.tsx
              └─ MessageInput.tsx
     ```

     (This is an illustrative example; adjust subfolders to match your app’s actual features.)

3. **Update Imports –** After moving files, update any import paths throughout the project. Leverage your IDE or TypeScript errors to find broken imports. If using a path alias like `@/components/...`, ensure it still points correctly (e.g. to `src/components`).

4. **Responsibility of Each Folder –** Document (even in the README or a comment) the purpose of each subfolder so future contributors understand:
   - `ui`: **Pure presentational components** – should ideally not contain complex business logic or state. They receive props and render UI.
   - `features`: **Feature components** – may combine UI components and contain feature-specific logic or state. Often these can be more complex and may interact with hooks, context, or libraries to implement a feature.
   - `layout`: **Layout components** – used by Next.js pages or app layouts to provide consistent structure (headers/footers) or layout context. These might wrap around `children` elements.
   - `auth`: **Auth components** – handles login/logout UI and potentially tie into authentication logic (could interface with NextAuth or your auth system in the future).

**Rationale:** This structured approach makes the project more scalable and navigable. By separating basic UI elements from feature-specific components, you encourage reusability and clarity. A developer can easily find all pieces of a certain feature in one place ([Next.js 14 Project Structure: Best Practices](https://nextjsstarter.com/blog/nextjs-14-project-structure-best-practices/#:~:text=Grouping%20by%20Feature%20or%20Module)), and designers can locate core UI elements centrally. The layout and auth groupings isolate concerns that cut across features (global layout and authentication) for better maintainability. Overall, this organization enforces the Single Responsibility Principle at the folder level: each folder has a distinct purpose, which improves teamwork and onboarding for the project.

## 3. Type Definitions (`types/` directory for shared types)

Establish a dedicated place for TypeScript types and interfaces that are reused across the app, such as domain models or API payloads. Steps to implement:

1. **Create a Types Directory –** Add a folder named **`types/`** at the root of `src/` (or at the project root if not using `src/`). This will house all shared `.d.ts` files, interfaces, and type aliases. For clarity, you can also alias this in `tsconfig.json` for easy imports (e.g. add `{"paths": {"@/types/*": ["types/*"]}}` under `compilerOptions` if using path aliases).

2. **Organize Type Files –** Inside `types/`, create files grouping related types. For example:
   - **`types/user.ts`** – Interfaces or types for User objects (e.g. `UserProfile`, `UserRole` enum).
   - **`types/api.ts`** – Types for API request/response shapes (if your app consumes a REST or GraphQL API).
   - **`types/spacetime.ts`** – Types related to SpacetimeDB domain models or messages (if any, e.g. defining the shape of data coming from the database or subscription events).
   - **`types/index.d.ts`** – (Optional) You can have an `index.d.ts` that re-exports or aggregates common types, or for global type augmentations if needed.

   Example:
   ```ts
   // types/user.ts
   export interface UserProfile {
     id: string;
     name: string;
     email: string;
   }

   export type UserRole = 'admin' | 'user' | 'guest';
   ```

   ```ts
   // types/api.ts
   export interface ApiResponse<T> {
     data: T;
     error?: string;
   }
   ```

3. **Use and Evolve Types –** Start moving any existing inline type definitions or interface exports into these files if they are shared. For instance, if multiple components use a `User` type, define it in `types/user.ts` and import it where needed. Keep feature-specific types close to their feature if only used there, but anything reused in multiple places should live in `types/` for a single source of truth.

4. **Ensure Type Safety Across App –** If certain types should be available globally (like certain ambient types or process env types), you can use a global *.d.ts file. For example, to augment `NodeJS.ProcessEnv` with your env var types, you might do that in `types/env.d.ts`. But generally, keep things explicitly imported for clarity.

**Rationale:** A dedicated `types/` directory makes it easy to manage and locate TypeScript definitions, improving maintainability and consistency. It prevents duplication of interface definitions and clarifies the shape of data used throughout the app ([Best Project Structure for Next.js App Router: A Guide for Easy Collaboration - Inside of Code](https://insideofcode.com/best-project-structure-for-next-js-app-router-a-guide-for-easy-collaboration/#:~:text=Types)). By standardizing domain models and contracts in one place, all parts of the application (components, hooks, utils, etc.) can import and use the same types, reducing bugs and mismatches. This approach also eases collaboration: new developers can refer to the `types/` folder to understand core data structures used in the project.

## 4. Custom Hooks (`hooks/` directory with example)

Create a directory for custom React hooks to encapsulate reusable logic. This prevents logic from being scattered in components and promotes reuse ([Best Project Structure for Next.js App Router: A Guide for Easy Collaboration - Inside of Code](https://insideofcode.com/best-project-structure-for-next-js-app-router-a-guide-for-easy-collaboration/#:~:text=Hooks)). Follow these steps:

1. **Add a Hooks Directory –** Create a **`hooks/`** folder (under `src/` if applicable). This will contain all your custom hook files, each named like `useSomething.ts`.

2. **Implement a Boilerplate Hook –** As an example, add a simple hook such as `useIsMounted` that many Next.js projects use to detect when mounted on client side (useful to avoid SSR mismatches):

   **File:** `hooks/useIsMounted.ts`:
   ```ts
   import { useEffect, useState } from 'react';

   /**
    * useIsMounted – returns true after the component is mounted (client-side), false on server.
    */
   export function useIsMounted(): boolean {
     const [isMounted, setIsMounted] = useState(false);
     useEffect(() => {
       setIsMounted(true);
     }, []);
     return isMounted;
   }
   ```

   This hook will be `false` on initial render (including SSR) and flip to `true` on the client after mounting. It's a handy utility to conditionally render parts of a component only on the client.

3. **Provide a Usage Example –** Demonstrate using the hook in a component (perhaps in a comment or in a sample component file):

   ```tsx
   // Example usage of useIsMounted in a component
   import { useIsMounted } from '@/hooks/useIsMounted';

   const ClientOnlyWidget: React.FC = () => {
     const isMounted = useIsMounted();
     if (!isMounted) {
       return null; // Avoid rendering on server
     }
     return <div>Now this renders only on the client side.</div>;
   };
   export default ClientOnlyWidget;
   ```

   This shows how the hook can be used to guard client-only logic.

4. **(Optional) Plan for SpacetimeDB Hooks –** Since you have SpacetimeDB, you might later create hooks like `useSpacetimeQuery` or `useSpacetimeSubscription` to fetch or stream data from the database. You can stub one now for future use:
   ```ts
   // hooks/useSpacetimeQuery.ts (placeholder for future implementation)
   import { useEffect, useState } from 'react';
   import { spacetimeClient } from '@/utils/spacetimedb'; // hypothetical import

   export function useSpacetimeQuery<T>(query: string): { data: T | null, error: any } {
     const [data, setData] = useState<T|null>(null);
     const [error, setError] = useState<any>(null);
     useEffect(() => {
       // Placeholder: in future, execute query via spacetimeClient and update state
       spacetimeClient.execute(query)
         .then(result => setData(result as T))
         .catch(err => setError(err));
     }, [query]);
     return { data, error };
   }
   ```
   For now this is just illustrative; actual implementation will depend on SpacetimeDB's client API. Keeping it minimal (or not using it at all yet) is fine.

5. **Document Hooks Usage –** Optionally, in a README or comment block, note that all custom hooks should reside in the `hooks/` directory. This makes it easy to find shared logic, and encourages writing tests for complex hooks separately from components.

**Rationale:** Using a `hooks/` directory centralizes custom React logic, improving organization and reusability ([Best Project Structure for Next.js App Router: A Guide for Easy Collaboration - Inside of Code](https://insideofcode.com/best-project-structure-for-next-js-app-router-a-guide-for-easy-collaboration/#:~:text=Hooks)). Hooks often contain stateful or effectful logic that multiple components might need (e.g., a `useAuth` hook for authentication state or a `useWindowSize` for responsive behavior). By isolating them, we adhere to DRY (Don't Repeat Yourself) principles and make our components leaner. The example `useIsMounted` demonstrates a simple pattern and ensures that even this basic utility is tested and reusable. Planning a stub for `useSpacetimeQuery` indicates how we’ll integrate SpacetimeDB queries in the future without bloating our components now.

## 5. SpacetimeDB Client Logic (Minimal now, scaffold for future)

Keep the SpacetimeDB integration lightweight for now, but set up a clear structure to expand later. We will retain a minimal client in `utils/spacetimedb.ts` and prepare a `lib/spacetimedb/` directory for future enhancements:

1. **Retain Minimal Client in Utils –** If you already have `utils/spacetimedb.ts`, keep it as a thin wrapper. For example, it might initialize a SpacetimeDB client and export it:
   ```ts
   // utils/spacetimedb.ts
   import { createClient } from 'spacetimedb-sdk';  // (hypothetical SDK import)
   export const spacetimeClient = createClient({ projectId: process.env.SPACETIME_PROJECT_ID });
   ```
   (Use the actual SpacetimeDB client initialization as per its docs. The key is to keep this file very simple – just configuration and export.)

2. **Create `lib/spacetimedb/` Structure –** Add a folder **`lib/spacetimedb/`**. This will house more complex logic around SpacetimeDB as the app grows. Create placeholder files to outline the intended structure:
   - **`lib/spacetimedb/client.ts`** – This could import and configure the SpacetimeDB client (similar to above). For now, it might just re-export what’s in `utils/spacetimedb` or have a stub. _E.g.:_
     ```ts
     import { spacetimeClient } from '@/utils/spacetimedb';
     // In future, additional setup or utility methods can be added here.
     export { spacetimeClient };
     ```
   - **`lib/spacetimedb/queries.ts`** – In future, define specific query functions or data-fetching logic. For now, add a stub function:
     ```ts
     // lib/spacetimedb/queries.ts
     /**
      * Placeholder for future SpacetimeDB query functions.
      * For now, this is a no-op or example.
      */
     export async function fetchExampleData() {
       // e.g., in future: return spacetimeClient.query('SELECT * FROM example');
       return Promise.resolve(null);
     }
     ```
   - **`lib/spacetimedb/subscriptions.ts`** (optional) – If SpacetimeDB supports realtime subscriptions, you might reserve a file for managing those. Stub an example:
     ```ts
     // lib/spacetimedb/subscriptions.ts
     export function subscribeToExample(callback: (data: any) => void) {
       // In future: spacetimeClient.subscribe('table_or_channel', callback);
       console.warn('subscribeToExample is not implemented yet.');
       return () => {}; // return unsubscribe function
     }
     ```
   - **`lib/spacetimedb/index.ts`** – Export a consolidated API for SpacetimeDB. For now:
     ```ts
     export * from './client';
     export * from './queries';
     export * from './subscriptions';
     ```

3. **Use the Scaffold in Future Development –** Going forward, when SpacetimeDB logic becomes more complex (e.g., handling live update streams, caching, or state management), implement those inside this `lib/spacetimedb` module. For example, you might implement reducers to transform incoming data or context providers to share DB state across components. The folder structure is now ready to accommodate that without cluttering other areas of the app.

4. **Minimal Integration for Now –** In the current codebase, you might not need to use much from `lib/spacetimedb` yet. Ensure everything still compiles and runs:
   - Existing usage of `utils/spacetimedb.ts` (if any) should remain working as before.
   - The new `lib/spacetimedb` does not introduce any breaking change; it's a preparation for maintainability.

**Rationale:** By scaffolding a dedicated module for SpacetimeDB, we isolate database concerns from UI and business logic. Even though at this stage the client logic remains minimal, having a clear place for it will keep the project organized as the feature grows. It prevents a single `utils/spacetimedb.ts` file from becoming a God object holding all DB code. Instead, we anticipate a clean separation of concerns (client setup, query utilities, subscription handlers, etc.). Stubbing out functions now with comments makes it easier for future contributors to see where to add new functionality. In short, this step is about **future-proofing** the project structure for SpacetimeDB integration, while maintaining the current minimal working state.

## 6. Environment Variable Validation (using Zod)

Introduce runtime validation for environment variables to catch configuration errors early. We'll use **Zod** (a schema validation library) to ensure `process.env` has the required variables and types:

1. **Install Zod –** If not already in the project, add Zod as a dependency:

   ```bash
   npm install zod
   ```

2. **Create an Env Schema –** Create a file **`lib/env.ts`** (or `src/env.ts` or `utils/env.ts` as preferred) to define and validate the env variables. For example:

   ```ts
   // lib/env.ts
   import { z } from 'zod';

   // 1. Define expected variables and their types
   const envSchema = z.object({
     NODE_ENV: z.enum(['development', 'test', 'production']),
     NEXT_PUBLIC_API_URL: z.string().url().optional(),  // sample public URL (optional)
     SPACETIME_PROJECT_ID: z.string().min(1),           // sample required var for SpacetimeDB
     // ... add other env vars as needed, e.g., API keys (as .min(1) for non-empty strings)
   });

   // 2. Parse and validate process.env against the schema
   const _env = envSchema.safeParse(process.env);
   if (!_env.success) {
     console.error('❌ Invalid environment variables:');
     _env.error.issues.forEach(issue => {
       console.error(` - ${issue.path.join('.')}: ${issue.message}`);
     });
     throw new Error('Environment validation failed. Fix the above variables and restart.');
   }

   export const env = _env.data;  // Export the validated env object

   // (Optional) Augment NodeJS.ProcessEnv type to match our schema for TypeScript
   declare global {
     namespace NodeJS {
       interface ProcessEnv extends z.infer<typeof envSchema> {}
     }
   }
   ```

   In this snippet:
   - We define a Zod schema (`envSchema`) listing required env vars and using validators (e.g., `url()` for URL format).
   - We call `safeParse` on `process.env`. If validation fails, we log the issues and throw an error, preventing the app from starting with misconfiguration ([Next.js 14+ Environment variables validation using Zod | by Avinash Kumar | Stackademic](https://blog.stackademic.com/next-js-14-environment-variables-validation-using-zod-6e1dd95c3406#:~:text=const%20envValidationResult%20%3D%20validateEnv)).
   - We export a constant `env` which is typed with the schema, so throughout the app we can do `env.SPACETIME_PROJECT_ID` confidently (and it will be of type string).
   - The global `ProcessEnv` augmentation is optional, but it can provide intellisense for `process.env.MY_VAR` in the rest of the app.

3. **Use the Validation Early –** Ensure this validation runs on startup:
   - If using Next.js App Router, you can import `lib/env` in your `next.config.js` or at the top of `app/layout.tsx` (server side). For example:
     ```ts
     // next.config.js
     require('./lib/env'); // will throw if env is invalid
     module.exports = { /* ... your next config ... */ };
     ```
     By doing this, when Next.js loads config, it validates env first.
   - Alternatively, if you have a custom server entry or a CLI script, import `lib/env.ts` there.
   - The key is to fail fast: don't start the dev server or build if env vars are missing or incorrect ([Next.js 14+ Environment variables validation using Zod | by Avinash Kumar | Stackademic](https://blog.stackademic.com/next-js-14-environment-variables-validation-using-zod-6e1dd95c3406#:~:text=When%20working%20with%20modern%20web,required%20variables%20are%20correctly%20defined)).

4. **Adjust Schema as Needed –** Update `envSchema` to include all variables your project needs. For example, if you use `NEXT_PUBLIC_SUPABASE_URL` or anything, add those. Use appropriate validators (`z.string()`, `.url()`, `.email()`, `.regex()` etc.) to enforce format. This also doubles as documentation for what env vars are expected.

**Rationale:** Validating environment variables provides early feedback if something is misconfigured, which is especially useful in development and staging environments. By using Zod to enforce types (string, number, URL, enum, etc.), you avoid subtle errors later in the app when an env var is undefined or has an unexpected value. This approach ensures the application **only starts when required variables are correctly defined** ([Next.js 14+ Environment variables validation using Zod | by Avinash Kumar | Stackademic](https://blog.stackademic.com/next-js-14-environment-variables-validation-using-zod-6e1dd95c3406#:~:text=When%20working%20with%20modern%20web,required%20variables%20are%20correctly%20defined)), making it more robust. Additionally, exporting a typed `env` object gives you autocomplete and type safety when accessing configuration throughout the app, reducing the chance of typos in `process.env` keys. In short, this step improves reliability and developer confidence when dealing with configuration.

## 7. Linting & Formatting Enhancements (ESLint, Prettier, Husky)

Ensure code style and quality tools are fully integrated into the development workflow. The project already has ESLint and Prettier, but we will double-check their configuration and add Git hooks (Husky + lint-staged) for automatic linting/formatting on commits:

1. **Verify ESLint/Prettier Config –** Confirm there are config files or entries:
   - **ESLint:** There should be an `.eslintrc.json` or similar. If not, create one extending Next.js defaults and integrating Prettier:
     ```json
     // .eslintrc.json
     {
       "extends": ["next/core-web-vitals", "prettier"],
       "plugins": ["@typescript-eslint"],
       "rules": {
         // example custom rules if needed
         "no-console": "warn"
       }
     }
     ```
     This uses Next's recommended config (which includes React, etc.), and `prettier` to turn off conflicting formatting rules. Adjust plugins and rules as needed (for instance, if using TailwindCSS, you might include the Tailwind ESLint plugin).
   - **Prettier:** Add a `.prettierrc` (or `prettier.config.js`) if not present to define code style. For example:
     ```json
     // .prettierrc
     {
       "singleQuote": true,
       "semi": true,
       "trailingComma": "es5",
       "printWidth": 100
     }
     ```
     These settings enforce single quotes, semicolons, trailing commas where valid in ES5, and a max line width of 100 characters. Feel free to use your preferred style.

   - Also ensure the VSCode or editor settings (if applicable) pick up Prettier on save, etc., for a smooth dev experience.

2. **Wire Scripts in Package.json –** Make sure **package.json** has convenient scripts and configurations:
   - Under `"scripts"`, add:
     ```json
     {
       "scripts": {
         "lint": "next lint",
         "format": "prettier --write ."
       }
     }
     ```
     The `lint` script uses Next.js' built-in ESLint (which applies to all files under `src/` by default). The `format` script runs Prettier on the entire project (you can narrow the scope or exclude certain dirs via .prettierignore if needed).
   - If not already, include the ESLint and Prettier config references in package.json as well (some projects do `"eslintConfig": {...}` or `"prettier": {...}` in package.json instead of separate files — either approach is fine as long as it’s configured).

3. **Install Husky and lint-staged –** These will automate running linters/formatters on pre-commit:
   ```bash
   npm install --save-dev husky lint-staged
   ```
   After installing, initialize Husky:
   ```bash
   npx husky install
   ```
   This will create a `.husky/` directory and add a `prepare` script to your package.json automatically (so that Husky gets set up on install). You should see in package.json:
   ```json
   "scripts": {
     // ... other scripts ...
     "prepare": "husky install"
   }
   ```

4. **Configure Pre-commit Hook –** Set up a Husky hook to run **lint-staged**:
   ```bash
   npx husky add .husky/pre-commit "npx lint-staged"
   ```
   This creates a `.husky/pre-commit` file that will execute lint-staged on staged files. (The command uses `npx` which ensures the local `lint-staged` runs.)

5. **Configure lint-staged –** Define which linters/formatters to run on which files. In your **package.json**, add a `lint-staged` field (or create a separate `lint-staged.config.js`). For example:
   ```json
   "lint-staged": {
     "*.{ts,tsx}": [
       "eslint --fix",
       "prettier --write"
     ],
     "*.{js,jsx}": [
       "eslint --fix",
       "prettier --write"
     ],
     "*.{css,md,json}": [
       "prettier --write"
     ]
   }
   ```
   This configuration will automatically fix ESLint errors and format with Prettier for any staged TypeScript/JavaScript files, and just format other file types like CSS, Markdown, JSON on commit.

6. **Provide Example Config (if needed) –** If the project’s ESLint and Prettier configs were not set up, use the examples above. Here’s a quick example **`.eslintrc.json`** for reference:
   ```json
   {
     "extends": ["next/core-web-vitals", "plugin:@typescript-eslint/recommended", "prettier"],
     "plugins": ["@typescript-eslint", "react"],
     "parserOptions": {
       "ecmaVersion": 2020,
       "sourceType": "module",
       "ecmaFeatures": {
         "jsx": true
       }
     },
     "rules": {
       "react/jsx-uses-react": "off", 
       "react/react-in-jsx-scope": "off"  // Next.js doesn't require React in scope
     }
   }
   ```
   And an example **`.prettierrc`**:
   ```json
   {
     "arrowParens": "always",
     "singleQuote": true,
     "trailingComma": "es5"
   }
   ```
   These are fairly standard and can be tweaked to team preferences.

7. **Test the Hook –** Try committing a file with a deliberate formatting issue (e.g., wrong quotes or missing semicolon). Git commit should trigger Husky, which runs lint-staged, automatically fixing the issue or rejecting the commit if ESLint finds an error it cannot fix. This ensures no code with lint errors or inconsistent style gets into the repository.

**Rationale:** Having ESLint and Prettier run automatically on each commit maintains code quality and consistency without relying on developers to manually run linters every time. It improves **code quality, readability, and consistency by catching issues early** ([How to Set Up Pre-Commit Hook Husky for Next.js 13 Project | by Anwar Gul | Stackademic](https://blog.stackademic.com/how-to-set-up-pre-commit-hook-husky-for-next-js-13-project-86c131397735#:~:text=Lint,code%20quality%2C%20readability%2C%20and%20consistency)). Husky’s Git hook integration means these checks happen in a pre-commit step, acting as a safety net. This is especially important in a team setting or even for personal projects to maintain discipline. By providing example config files and scripts, we ensure that anyone setting up the project afresh will have the same linting/formatting rules in effect. Ultimately, this leads to a cleaner codebase and fewer code review comments about styling or trivial issues, letting developers focus on more important aspects of the code.

---

By following this implementation plan step-by-step, you will enhance the project with a robust testing setup, a cleaner organization for components and hooks, stronger type safety, a scalable structure for SpacetimeDB integration, validated configuration management, and automated code quality enforcement. These improvements will make the project more maintainable and team-friendly going forward. Good luck with the integration! 

**Sources:**

- Next.js Docs – Vitest Setup ([Testing: Vitest | Next.js](https://nextjs.org/docs/app/building-your-application/testing/vitest#:~:text=To%20manually%20set%20up%20Vitest%2C,following%20packages%20as%20dev%20dependencies)) ([Testing: Vitest | Next.js](https://nextjs.org/docs/app/building-your-application/testing/vitest#:~:text=import%20,paths))  
- Next.js Docs – Jest Setup ([Testing: Jest | Next.js](https://nextjs.org/docs/app/building-your-application/testing/jest#:~:text=To%20set%20up%20Jest%2C%20install,following%20packages%20as%20dev%20dependencies))  
- Next.js Starter Blog – Component Organization Best Practices ([Next.js 14 Project Structure: Best Practices](https://nextjsstarter.com/blog/nextjs-14-project-structure-best-practices/#:~:text=Organize%20components%20by%20feature%20or,folder%20with))  
- InsideOfCode – Project Structure Tips (Hooks & Types) ([Best Project Structure for Next.js App Router: A Guide for Easy Collaboration - Inside of Code](https://insideofcode.com/best-project-structure-for-next-js-app-router-a-guide-for-easy-collaboration/#:~:text=Hooks)) ([Best Project Structure for Next.js App Router: A Guide for Easy Collaboration - Inside of Code](https://insideofcode.com/best-project-structure-for-next-js-app-router-a-guide-for-easy-collaboration/#:~:text=Types))  
- Stackademic – Env Var Validation with Zod ([Next.js 14+ Environment variables validation using Zod | by Avinash Kumar | Stackademic](https://blog.stackademic.com/next-js-14-environment-variables-validation-using-zod-6e1dd95c3406#:~:text=const%20envValidationResult%20%3D%20validateEnv)) ([Next.js 14+ Environment variables validation using Zod | by Avinash Kumar | Stackademic](https://blog.stackademic.com/next-js-14-environment-variables-validation-using-zod-6e1dd95c3406#:~:text=When%20working%20with%20modern%20web,required%20variables%20are%20correctly%20defined))  
- Stackademic – Pre-commit Hooks (Husky + lint-staged rationale) ([How to Set Up Pre-Commit Hook Husky for Next.js 13 Project | by Anwar Gul | Stackademic](https://blog.stackademic.com/how-to-set-up-pre-commit-hook-husky-for-next-js-13-project-86c131397735#:~:text=Lint,code%20quality%2C%20readability%2C%20and%20consistency))  
- Wisp Blog – Vitest vs Jest (Performance Notes)