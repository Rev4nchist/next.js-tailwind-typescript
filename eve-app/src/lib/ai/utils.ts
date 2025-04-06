import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';

// Ensure OpenRouter API key is available
// Note: This check seems misplaced if embeddings use OpenAI. Keeping for now.
const openRouterApiKey = process.env.OPENROUTER_API_KEY;

if (!openRouterApiKey) {
  // Allow startup without key ONLY if explicitly allowed (e.g., for testing UI without AI calls)
  if (process.env.ALLOW_MISSING_OPENROUTER_KEY !== 'true') {
    throw new Error('Missing environment variable: OPENROUTER_API_KEY');
  }
  console.warn('Missing OPENROUTER_API_KEY. AI features requiring embeddings might fail if OpenRouter is needed elsewhere.');
}

/**
 * Generates an embedding for the given text using Vercel AI SDK.
 * In development or if OPENAI_API_KEY is missing, falls back to random vectors.
 * 
 * @param text The text content to embed.
 * @param model The embedding model ID (defaults to OpenAI's text-embedding-3-large).
 * @returns A promise that resolves to an array of numbers representing the embedding.
 */
export const generateEmbedding = async (
  text: string,
  model: string = 'text-embedding-3-large'
): Promise<number[]> => {
  console.log(`Generating embedding for text: "${text.substring(0, 30)}..." using model: ${model}`);
  const openaiApiKey = process.env.OPENAI_API_KEY;

  // Use fake embeddings if OpenAI key is missing and not in production
  if (!openaiApiKey) {
    if (process.env.NODE_ENV !== 'production') {
       console.warn('No OpenAI API key provided. Falling back to random embeddings for development/testing.');
       return generateFakeEmbedding();
    } else {
       console.error('CRITICAL: Missing OPENAI_API_KEY in production environment! Cannot generate embeddings.');
       // Decide appropriate production behavior: throw error or return fake (with severe logging)?
       // Throwing an error is safer to prevent unexpected behavior with fake data.
       throw new Error('Missing OPENAI_API_KEY in production environment.');
    }
  }

  try {
    // Use the Vercel AI SDK's embed function
    const { embedding, usage } = await embed({
      model: openai.embedding(model), // Use the specified or defaulted model
      value: text,
      // Optional settings can be added here, e.g.:
      // maxRetries: 3,
      // abortSignal: AbortSignal.timeout(15000) // 15 second timeout
    });

    console.log(`Embedding generated successfully. Token usage: ${usage?.tokens ?? 'N/A'}`);
    return embedding;

  } catch (error) {
    console.error('Error generating embedding via Vercel AI SDK:', error);

    // Fall back to random embeddings in development
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Vercel AI SDK embed failed. Falling back to random embeddings for development.');
      return generateFakeEmbedding();
    }

    // In production, re-throw the error after logging
    throw new Error(`Failed to generate embedding via Vercel AI SDK: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Generates a fake embedding vector for development/testing purposes.
 * Dimensions match OpenAI's text-embedding-3-small model (1536 dimensions)
 */
function generateFakeEmbedding(): number[] {
  // Create a 1536-dimension vector with random values between -1 and 1
  // This mimics the dimensions of OpenAI's text-embedding-3-small
  return Array(1536).fill(0).map(() => Math.random() * 2 - 1);
} 