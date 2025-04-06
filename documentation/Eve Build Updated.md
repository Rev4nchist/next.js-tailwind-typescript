Okay, excellent clarifications! This gives us a much clearer path forward. Let's ditch SpaceTimeDB and the old MCP server, focusing on Supabase and a dual web/library approach using the Vercel AI SDK.

Here's a refined, step-by-step plan incorporating your decisions:

**Phase 1: Architecture & Foundation**

1.  **Project Setup:**
    *   Initialize a new Next.js project with TypeScript (using `create-next-app`). ✅
    *   Install necessary dependencies: Vercel AI SDK (`ai`), Supabase client (`@supabase/supabase-js`), and potentially UI libraries (e.g., Shadcn/ui). ✅
2.  **Core Architecture:**
    *   **Backend (Next.js API Routes):** This will house the core AI SDK logic, including:
        *   LLM interaction (`generateText`, `streamText`, `generateObject`).
        *   Tool definitions (memory access, E.V.E. abilities).
        *   Middleware (for memory retrieval/RAG).
        *   API endpoints for the frontend to call.
    *   **Frontend (Next.js Pages/App Router):** The chat interface using `@ai-sdk/react` (`useChat`).
    *   **Database (Supabase):** Single source of truth for all memory.
    *   **`eve-memory-client` Library:** A separate, lightweight TypeScript library (can be developed within the same monorepo initially using npm workspaces or similar) specifically for *sending* data *to* Supabase from external projects.

**Phase 2: Supabase Setup**

1.  **Initialize Supabase Project:** Create a new project in your Supabase account. ✅
2.  **Enable pgvector:** Follow Supabase docs to enable the `vector` extension. ✅
3.  **Define Tables:** Create the necessary tables using SQL or the Supabase UI: ✅
    *   `entities`: (e.g., `id` (UUID, PK), `created_at`, `name` (text), `type` (text - 'project', 'person', 'task', 'concept'), `data` (jsonb - for flexible attributes)).
    *   `relations`: (e.g., `id` (UUID, PK), `created_at`, `source_entity_id` (FK -> entities.id), `target_entity_id` (FK -> entities.id), `type` (text - 'depends_on', 'created_by', 'assigned_to'), `data` (jsonb)).
    *   `knowledge`: (e.g., `id` (UUID, PK), `created_at`, `entity_id` (FK -> entities.id, optional), `content` (text), `embedding` (vector - size depends on embedding model, e.g., 1536 for OpenAI `text-embedding-3-small`), `source` (text, optional), `metadata` (jsonb)).
    *   *Indexes:* Create appropriate indexes, especially a GIN or IVFFlat index on the `embedding` column in `knowledge` for efficient vector similarity search. ✅
4.  **Environment Variables:** Securely store your Supabase URL and Anon Key (and Service Role Key for backend operations) in `.env.local`. (Manual Step)

**Phase 3: AI SDK Implementation (Backend - API Routes)**

1.  **Supabase Client:** Create a utility function or singleton instance for the Supabase client configured with the service role key for backend access. ✅
2.  **Embedding Generation:** Choose an embedding model (e.g., OpenAI's `text-embedding-3-small`). Create a function that takes text and uses the chosen provider's API to generate embeddings. ✅
3.  **Memory Tools (AI SDK Tools):** Define functions that the LLM can call: ✅
    *   `createEntity(name, type, data)`: Inserts into the `entities` table.
    *   `createRelation(source_id, target_id, type, data)`: Inserts into the `relations` table.
    *   `addKnowledge(content, entity_id, source, metadata)`: Generates embedding for `content`, then inserts into the `knowledge` table.
    *   `findEntities(name_query, type_filter)`: Queries the `entities` table.
    *   `findRelations(entity_id, relation_type)`: Queries the `relations` table.
    *   `semanticSearchKnowledge(query_text, entity_id_filter, top_k)`: Generates embedding for `query_text`, then performs a vector similarity search on the `knowledge` table (using Supabase `match_vectors` function), potentially filtering by `entity_id`. Returns the `content` of the top_k results.
4.  **RAG Middleware (AI SDK Middleware):** Create middleware that intercepts `generateText` / `streamText` calls. (⚠️ Needs Fix: Type errors in `augmentPromptWithKnowledge`)
    *   Take the user's prompt/query.
    *   Call the `semanticSearchKnowledge` tool (or directly query Supabase vector search) to find relevant memories/knowledge snippets.
    *   Prepend these snippets to the original prompt, clearly marking them as retrieved context (e.g., "Relevant Information:\n- Snippet 1\n- Snippet 2\n\nUser Query: ...").
    *   Pass the augmented prompt to the LLM.
5.  **Ability Tools (AI SDK Tools):** Define tools for E.V.E.'s specific tasks. These will likely combine memory retrieval tools with LLM calls:
    *   `createProjectRoadmap(project_name, requirements)`: Might first `findEntities` for the project, `semanticSearchKnowledge` for related context, then call `generateObject` with a specific schema to outline the roadmap steps. Finally, it might call `addKnowledge` to store the generated roadmap.
    *   `summarizeResearchTopic(topic)`: Would use `semanticSearchKnowledge` heavily and then `generateText` for summarization.
    *   *(More tools as needed)*
6.  **API Route:** Create a Next.js API route (e.g., `/api/chat`) that:
    *   Receives messages from the frontend.
    *   Initializes the AI SDK core functions (`generateText` or `streamText`).
    *   Provides the defined Memory and Ability tools.
    *   Applies the RAG Middleware.
    *   Streams the response back to the frontend.

**Phase 4: Web Interface (Frontend - Next.js)**

1.  **Chat Component:** Build a React component using `useChat` from `@ai-sdk/react`.
2.  **API Connection:** Point `useChat` to your `/api/chat` endpoint.
3.  **UI:** Design the chat interface, potentially using components from Shadcn/ui or similar libraries. Handle displaying different message parts if needed (though initially, text might suffice).

**Phase 5: `eve-memory-client` Library**

1.  **Setup:** Create a new directory (e.g., `packages/eve-memory-client` within a monorepo structure, or a separate project) and initialize it as a TypeScript package (`npm init -y`, install basic HTTP client like `axios` or use native `fetch`, `typescript`, build tools like `tsup`). Configure `tsconfig.json` and `package.json` for library output.
2.  **Client Class:** Create a class `EveMemoryClient`.
    *   Constructor accepts the URL of the deployed E.V.E. web application's API (e.g., `https://your-eve-website.com/api`) and potentially an API key for authentication.
    *   Methods will make authenticated HTTP requests to dedicated API endpoints on the main Next.js application backend:
        *   `async addKnowledge({ content, entity_id, source, metadata })`: Sends a POST request to an endpoint like `/api/memory/addKnowledge`. The backend endpoint handles embedding generation and insertion into Supabase.
        *   `async logEntity({ name, type, data })`: Sends a POST request to an endpoint like `/api/memory/logEntity`.
        *   `async logRelation(...)`: Sends a POST request to an endpoint like `/api/memory/logRelation`.
    *   *Note:* This library does *not* contain the core AI logic or direct Supabase credentials. It acts purely as a secure interface to the main E.V.E. application's memory management API.
3.  **Build:** Configure `tsup` (or similar) to bundle the library into distributable formats (e.g., ESM, CJS).
4.  **Usage:** In other projects, install this package (`npm install path/to/eve-memory-client` or later `npm install @your-scope/eve-memory-client`), initialize it with the E.V.E. API URL and key, and call its methods to send data to E.V.E.'s central memory system.

**Phase 6: Deployment & Iteration**

1.  **Deploy Web App:** Deploy the Next.js application to Vercel. Configure environment variables for Supabase.
2.  **Publish Library:** Publish the `eve-memory-client` package to npm (or a private registry).
3.  **Refine:** Continuously add more abilities (tools), improve memory retrieval (middleware logic, prompt engineering), enhance the UI, and update the client library as needed.

This detailed plan provides a solid foundation. We'll start by setting up the Next.js project and Supabase, then incrementally build the backend API, memory tools, middleware, frontend, and finally the client library.

Ready to start with setting up the Next.js project and Supabase tables?
