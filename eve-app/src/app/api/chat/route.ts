import { streamText, CoreMessage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import {
    addKnowledgeTool,
    createEntityTool,
    createRelationTool,
    findEntitiesTool,
    findRelationsTool,
    semanticSearchKnowledgeTool
} from '@/lib/ai/tools/memory-tools';
import { extractUserQuery, augmentSystemPrompt } from '@/lib/ai/middleware/rag-middleware';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Define the OpenRouter client
const openai = createOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    headers: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000", 
      "X-Title": "E.V.E. Assistant",
    }
});

// Base system message
const BASE_SYSTEM_MESSAGE = 'You are E.V.E (Elevated Virtual Essence), a helpful AI assistant integrated with a persistent memory system. Use the available tools to manage entities, relations, and knowledge in your memory when appropriate to answer user queries or store information.';

export async function POST(req: Request) {
  try {
    console.log('Received chat request');
    
    // Parse the request body
    const { messages }: { messages: CoreMessage[] } = await req.json();
    console.log(`Received ${messages.length} messages in conversation`);

    // Extract the user's last message for RAG context
    const userQuery = extractUserQuery(messages);
    
    if (userQuery) {
      console.log(`RAG: Extracted user query "${userQuery.substring(0, 50)}${userQuery.length > 50 ? '...' : ''}"`);
    } else {
      console.log('RAG: No user query found');
    }

    // Augment the system message with relevant knowledge if a user query is present
    console.log('RAG: Augmenting system message with knowledge search');
    const systemMessage = await augmentSystemPrompt(
      BASE_SYSTEM_MESSAGE,
      userQuery,
      { top_k: 5, match_threshold: 0.7 }
    );
    
    const isAugmented = systemMessage.length > BASE_SYSTEM_MESSAGE.length;
    console.log(`RAG: System message ${isAugmented ? 'was augmented with knowledge' : 'was not augmented (no relevant knowledge found)'}`);

    // Generate the response with the augmented system message
    console.log('Generating AI response with streamText');
    const result = await streamText({
      model: openai('openrouter/quasar-alpha'), // Using Quasar Alpha through OpenRouter
      messages,
      system: systemMessage, // Use the augmented system message
      tools: {
        addKnowledge: addKnowledgeTool,
        createEntity: createEntityTool,
        createRelation: createRelationTool,
        findEntities: findEntitiesTool,
        findRelations: findRelationsTool,
        searchKnowledge: semanticSearchKnowledgeTool
      }
    });

    console.log('Returning stream response');
    // Respond with the stream
    return result.toDataStreamResponse();

  } catch (error) {
    console.error('Error in chat API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
} 