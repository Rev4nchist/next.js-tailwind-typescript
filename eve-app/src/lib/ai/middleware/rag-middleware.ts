import { CoreMessage } from 'ai';
import { getSupabaseServerClient } from '@/lib/supabase/client';
import { generateEmbedding } from '@/lib/ai/utils';
import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

// --- Knowledge Search Logic ---

/**
 * Represents the structure of a knowledge search result.
 */
export interface KnowledgeResult {
  id: string;
  content: string;
  similarity: number;
  entity_id?: string;
  source?: string;
  created_at?: string;
}

/**
 * Performs semantic search against the knowledge base using Supabase pgvector.
 */
export async function performSemanticSearch(
  query_text: string,
  top_k = 5,
  entity_id_filter: string | null = null
): Promise<{ success: boolean; results: KnowledgeResult[]; error?: string }> {
  console.log(`searchKnowledge: Searching for "${query_text.substring(0, 50)}..."`);

  // 1. Generate embedding for the query_text
  let queryEmbedding: number[];
  try {
    queryEmbedding = await generateEmbedding(query_text);
  } catch (error) {
    const errorMsg = `Failed to generate embedding for search query: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMsg);
    return { success: false, results: [], error: errorMsg };
  }

  const supabase = getSupabaseServerClient();

  try {
    // 2. Call the Supabase RPC function
    const rpcParams: {
      query_embedding: number[];
      k: number;
      entity_id_param?: string;
    } = {
      query_embedding: queryEmbedding,
      k: top_k,
    };

    // Add entity_id_param only if entity_id_filter is provided
    if (entity_id_filter) {
      rpcParams.entity_id_param = entity_id_filter;
    }

    const { data, error } = await supabase.rpc('match_knowledge_top_k', rpcParams);

    if (error) {
      console.error('Supabase RPC error in searchKnowledge:', error);
      // Add specific check for function not existing
      if (error.message.includes('function public.match_knowledge_top_k') && error.message.includes('does not exist')) {
        return { success: false, results: [], error: `Supabase RPC error: The 'match_knowledge_top_k' function is not defined in the database. Please ensure it's created with the correct parameters.` };
      }
      return { success: false, results: [], error: `Supabase RPC error: ${error.message}` };
    }

    console.log(`searchKnowledge: Found ${data?.length || 0} matches.`);
    const results = data as KnowledgeResult[] || [];
    // Log similarity scores for returned matches
    if (results.length > 0) {
      console.log('Similarity scores of returned matches:', results.map(r => r.similarity.toFixed(4)).join(', '));
    }
    return { success: true, results };

  } catch (error) {
    console.error('Error executing searchKnowledge RPC:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, results: [], error: errorMessage };
  }
}

/**
 * Formats retrieved knowledge into a usable context message.
 */
export function formatKnowledgeContext(results: KnowledgeResult[]): string {
  const retrievedContext = results
    .map(r => `- ${r.content}`)
    .join('\n');
  
  return `\n\nRelevant Information Retrieved from Memory:\n${retrievedContext}\n--- End of Retrieved Information ---\n`;
}

/**
 * Extracts user query from the last message in a conversation.
 * Works with both string content and array content from CoreMessage.
 */
export function extractUserQuery(messages: CoreMessage[]): string {
  if (messages.length === 0) return '';
  
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== 'user') return '';
  
  if (typeof lastMessage.content === 'string') {
    return lastMessage.content;
  } 
  
  if (Array.isArray(lastMessage.content)) {
    for (const part of lastMessage.content) {
      if ('type' in part && part.type === 'text' && 'text' in part) {
        return part.text;
      }
    }
  }
  
  return '';
}

// --- Prompt Augmentation Logic ---

/**
 * Represents the result of augmenting a prompt, including the search results used.
 */
export interface AugmentResult {
  augmentedPrompt: string;
  searchResults: KnowledgeResult[] | null;
  error?: string; // Optional error message if augmentation failed
}

/**
 * Helper function to augment a system prompt with retrieved knowledge.
 * Implements query expansion and tiered semantic search.
 * Returns both the augmented prompt and the raw search results.
 */
export async function augmentSystemPrompt(
  baseSystemPrompt: string,
  userQuery: string,
  options: { 
    top_k?: number; 
    initial_threshold?: number; 
    expansion_count?: number; 
    llm_model?: string; // Made optional
  } = {}
): Promise<AugmentResult> {
  // Apply defaults inside the function
  const effectiveOptions = {
    top_k: options.top_k ?? 5,
    initial_threshold: options.initial_threshold ?? 0.7,
    expansion_count: options.expansion_count ?? 2,
    llm_model: options.llm_model ?? 'mistralai/mistral-7b-instruct'
  };

  if (!userQuery) {
     return { augmentedPrompt: baseSystemPrompt, searchResults: null };
  }

  let allQueries = [userQuery];
  let expansionError: string | undefined = undefined;

  // --- Query Expansion --- 
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterApiKey) {
    console.warn('Missing OPENROUTER_API_KEY. Skipping query expansion.');
  } else {
      try {
        const openrouter = createOpenRouter({
            apiKey: openRouterApiKey,
        });

        const modelId = effectiveOptions.llm_model;
        const modelToUse = openrouter(modelId);
        
        console.log(`Generating query variations for: "${userQuery.substring(0, 50)}..." using model: ${modelId}`);
        
        const { text: expandedQueriesText } = await generateText({
          model: modelToUse, 
          prompt: `Generate ${effectiveOptions.expansion_count} alternative ways to phrase the following user query, focusing on capturing the core intent. Each variation should be on a new line. Do not add any introductory text, just the variations.\n\nOriginal Query: "${userQuery}"\n\nVariations:`,
          temperature: 0.5,
          maxTokens: 100 * effectiveOptions.expansion_count,
        });

        const variations = expandedQueriesText
          .split('\n')
          .map(q => q.trim())
          .filter(q => q.length > 0 && q.toLowerCase() !== userQuery.toLowerCase());

        if (variations.length > 0) {
            console.log(`Generated ${variations.length} variations:`, variations);
            allQueries = [userQuery, ...variations.slice(0, effectiveOptions.expansion_count)];
        } else {
            console.log("LLM did not generate usable query variations.");
        }
      } catch (error) {
        expansionError = `Error generating query variations with ${effectiveOptions.llm_model}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(expansionError);
      }
  }
  // --- End Query Expansion ---

  let allResults: KnowledgeResult[] = [];
  const seenIds = new Set<string>();
  let searchFailedOverall = false;
  let searchErrorMsg: string | undefined = undefined;

  // 2. Perform Search for Each Query Variation (No longer tiered by threshold)
  for (const currentQuery of allQueries) {
    console.log(`--- Processing query: "${currentQuery.substring(0, 100)}..." ---`);
    console.log(`Attempting semantic search for "${currentQuery.substring(0,50)}..."`);
    const currentSearchResult = await performSemanticSearch(
      currentQuery,
      effectiveOptions.top_k
    );

    if (currentSearchResult.success && currentSearchResult.results.length > 0) {
      console.log(`Found ${currentSearchResult.results.length} results for "${currentQuery.substring(0,50)}..."`);
      // Add unique results
      for (const result of currentSearchResult.results) {
        if (!seenIds.has(result.id)) {
          allResults.push(result);
          seenIds.add(result.id);
        }
      }
    } else if (!currentSearchResult.success) {
      searchErrorMsg = `Semantic search failed for "${currentQuery.substring(0,50)}...": ${currentSearchResult.error}`;
      console.error(searchErrorMsg);
      searchFailedOverall = true;
    } else {
      console.log(`No results found for "${currentQuery.substring(0,50)}...".`);
    }
  } // End query loop

  // 3. Format and Return Results
  if (allResults.length === 0) {
     let finalError = expansionError; // Start with potential expansion error
     if (searchFailedOverall) {
        const failMsg = 'Semantic search ultimately failed for one or more queries.';
        console.error(failMsg);
        finalError = finalError ? `${finalError}. ${failMsg}` : failMsg;
        if (searchErrorMsg) { // Add last specific search error if available
           finalError = `${finalError} Last error: ${searchErrorMsg}`;
        }
     } else {
        console.log('No relevant knowledge found after trying all queries.');
     }
     // Return base prompt, null results, and any accumulated error message
     return { augmentedPrompt: baseSystemPrompt, searchResults: null, error: finalError }; 
  }

  // Re-rank results based on similarity score (descending) before formatting
  allResults.sort((a, b) => b.similarity - a.similarity);

  console.log(`Returning ${allResults.length} unique knowledge results after expansion.`);
  const contextMessage = formatKnowledgeContext(allResults);
  
  // Return augmented prompt and the successful search results
  return {
     augmentedPrompt: baseSystemPrompt + contextMessage,
     searchResults: allResults,
     error: expansionError // Include expansion error even if search succeeded
  };
} 