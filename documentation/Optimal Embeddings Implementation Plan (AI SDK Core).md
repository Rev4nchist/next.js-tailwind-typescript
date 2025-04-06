
# Report: Implementing Optimal Embeddings with AI SDK Core

**Goal:** Implement a robust and useful memory system for a personal assistant using embeddings generated via the AI SDK Core library, optimized for correctness and retrieval performance.

**Based On:** AI SDK Core: Embeddings Documentation (Provided)

## 1. Core AI SDK Functions

The documentation highlights three key functions:

*   `embed({ model, value, [options] })`: Generates an embedding vector (`number[]`) for a single string. Useful for embedding incoming queries for searching against stored memories.
*   `embedMany({ model, values, [options] })`: Generates embedding vectors (`number[][]`) for an array of strings. This is **crucial for efficiency** when processing batches of text chunks to store as memories. The output array order matches the input `values` array.
*   `cosineSimilarity(embedding1, embedding2)`: Calculates the similarity between two vectors. Useful for ranking search results or comparing specific items, though primary retrieval is usually handled by a vector database.

**Options:** Both `embed` and `embedMany` support:
    *   `maxRetries`: Controls retry attempts on failure (default: 2).
    *   `abortSignal`: Allows aborting requests or setting timeouts.
    *   `headers`: For sending custom HTTP headers.
    *   They also return a `usage` object detailing token consumption.

## 2. Recommended Embedding Models

The SDK supports various models. Based on the documentation, good starting points are:

*   **OpenAI:**
    *   `openai.embedding('text-embedding-3-small')`: (1536 dimensions) - Good balance of performance and cost. **Recommended default.**
    *   `openai.embedding('text-embedding-3-large')`: (3072 dimensions) - Higher potential accuracy, but higher cost and dimensionality. Consider if 'small' isn't sufficient.
*   **Mistral:**
    *   `mistral.embedding('mistral-embed')`: (1024 dimensions) - A strong alternative if using the Mistral ecosystem.

Choose the model that best fits your provider preference, budget, and performance needs.

## 3. Implementation Strategy

This strategy combines SDK functions with necessary external components (chunking, storage).

**A. Text Chunking (Pre-computation Step)**

*   **Requirement:** The AI SDK `embedMany` function expects an array of strings. You must first process the raw information (conversations, notes, user data) into meaningful chunks *before* calling the SDK.
*   **Recommendation:** Implement semantic chunking. Divide text based on logical breaks (paragraphs, conversation turns, sentence groups) rather than fixed character counts. This preserves context within each chunk. Consider small overlaps between chunks.
*   **Metadata:** For each text chunk, prepare associated metadata. This is **essential** for effective filtering and retrieval. Minimum metadata should include:
    *   `id`: Unique identifier for the chunk.
    *   `text`: The actual text content of the chunk.
    *   `source`: Origin of the information (e.g., 'chat', 'user_profile', 'document:{doc_id}').
    *   `timestamp`: ISO 8601 timestamp of when the information was recorded.
    *   `conversation_id` (optional): Link related chat messages.
    *   `tags` (optional): Keywords for potential hybrid search.

**B. Batch Embedding with `embedMany`**

*   Use `embedMany` for efficiency when adding new memories. Process chunks in batches.
*   **Workflow:**
    1.  Prepare a batch of text chunks (strings) from your chunking process.
    2.  Prepare the corresponding metadata objects for each chunk.
    3.  Call `embedMany` with the text chunks and your chosen model.
    4.  Handle potential errors using try/catch and consider configuring `maxRetries`.
    5.  Match the resulting `embeddings` array with your prepared chunks and metadata (remember the order is preserved).

**Example (Conceptual TypeScript):**

```typescript
import { embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
// Assume 'textChunks' is string[] and 'metadataList' is object[] from your chunking process
// Example: textChunks = ["Chunk 1 text", "Chunk 2 text", ...]
// Example: metadataList = [{ id: "c1", text: "Chunk 1 text", source: "chat", timestamp: "...", ... }, { id: "c2", ... }]

async function generateAndStoreEmbeddings(textChunks: string[], metadataList: any[]) {
  if (textChunks.length === 0) {
    console.log("No chunks to embed.");
    return;
  }

  try {
    const { embeddings, usage } = await embedMany({
      model: openai.embedding('text-embedding-3-small'), // Or your chosen model
      values: textChunks,
      // Optional: Configure retries/timeouts if needed
      // maxRetries: 3,
      // abortSignal: AbortSignal.timeout(15000) // 15 seconds timeout
    });

    console.log(`Successfully generated ${embeddings.length} embeddings. Usage: ${usage.tokens} tokens.`);

    // Combine embeddings with metadata
    const memoriesToStore = embeddings.map((embeddingVector, index) => ({
      id: metadataList[index].id, // Use pre-generated ID
      vector: embeddingVector,    // The embedding itself
      payload: metadataList[index] // Store all metadata here
    }));

    // --> Next Step: Store 'memoriesToStore' in a Vector Database (see Section C)
    await storeInMemoryDB(memoriesToStore);

  } catch (error) {
    console.error("Error generating embeddings:", error);
    // Implement error handling/logging
  }
}

// Placeholder for vector DB interaction
async function storeInMemoryDB(memories: any[]) {
  console.log(`Storing ${memories.length} memories in the vector database...`);
  // Replace with actual vector database client code (e.g., Pinecone, ChromaDB, Vercel KV)
  // Example: await vectorDBClient.upsert(memories);
}

// --- Calling the function ---
// const { textChunks, metadataList } = performChunking(rawInputData);
// await generateAndStoreEmbeddings(textChunks, metadataList);

```

**C. Storage (Vector Database)**

*   **Requirement:** The AI SDK *generates* embeddings; it does *not* store them. You need a dedicated vector database.
*   **Recommendation:** Use a vector database optimized for similarity search (e.g., Pinecone, ChromaDB, Weaviate, Supabase pgvector, Vercel KV with vector search).
*   **Implementation:** Store each record containing:
    *   A unique ID (matching your chunk ID).
    *   The embedding vector (`number[]`).
    *   The associated metadata object (as the 'payload' or similar field).
*   **Indexing:** Ensure appropriate indexing (e.g., HNSW) is configured in the database for fast searches. Index metadata fields used for filtering (like `timestamp`, `source`).

**D. Retrieval**

*   **Workflow:**
    1.  Embed the user's query (or relevant context) using `embed` with the *same* embedding model used for storage.
    2.  Query the vector database using the query vector to find the top N most similar memory vectors (nearest neighbors).
    3.  **Crucially:** Use metadata filtering *within* the vector database query. For example:
        *   Filter by `timestamp` (e.g., memories from the last week).
        *   Filter by `source` (e.g., only from 'chat').
        *   Filter by `conversation_id`.
    4.  The vector database returns the matching records (including their metadata).
    5.  Use the retrieved text (from the metadata `payload`) and potentially other metadata to augment the context for the assistant's response generation.

**Example (Conceptual Query):**

```typescript
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';

async function searchMemories(queryText: string, filterOptions: any = {}) {
  try {
    // 1. Embed the query
    const { embedding: queryVector } = await embed({
      model: openai.embedding('text-embedding-3-small'), // SAME model as storage
      value: queryText,
    });

    // 2. Query Vector DB (Conceptual)
    // Replace with actual vector DB client code
    const searchResults = await vectorDBClient.search({
      vector: queryVector,
      topK: 5, // Retrieve top 5 relevant memories
      filter: { // Apply metadata filters
        timestamp: { $gte: filterOptions.sinceTimestamp }, // Example: filter by date
        source: filterOptions.source // Example: filter by source
        // Add other filters as needed
      },
      includePayload: true // Ensure metadata is returned
    });

    console.log(`Found ${searchResults.length} relevant memories.`);
    return searchResults.map(result => result.payload); // Return the metadata/text

  } catch (error) {
    console.error("Error searching memories:", error);
    return [];
  }
}

// --- Calling the function ---
// const relevantMemories = await searchMemories(
//   "What did we discuss about project alpha last Monday?",
//   { sinceTimestamp: '2025-03-31T00:00:00Z', source: 'chat' }
// );
```

## 4. Conclusion & Next Steps

This plan outlines using the AI SDK Core's `embedMany` function efficiently within a broader embedding pipeline.

**Cursor Implementation Tasks:**

1.  **Implement Chunking Logic:** Create robust functions to segment input text semantically and generate associated metadata.
2.  **Integrate Vector Database:** Choose and set up a vector database client. Implement the `storeInMemoryDB` and `searchMemories` (or similar) functions using the chosen DB's API.
3.  **Implement `generateAndStoreEmbeddings`:** Use the AI SDK's `embedMany` as shown, connecting the chunking output to the vector DB storage function.
4.  **Implement Retrieval Logic:** Use the AI SDK's `embed` for queries and integrate the vector DB search with metadata filtering.
5.  **Refine and Test:** Test with realistic data, evaluate retrieval quality, and iterate on chunking, model choice, and retrieval parameters. Monitor token usage via the `usage` object.

This approach ensures correct usage of the AI SDK for embedding generation while incorporating best practices for creating a useful and performant memory system.
