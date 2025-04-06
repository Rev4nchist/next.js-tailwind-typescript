import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/client';
import { generateEmbedding } from '@/lib/ai/utils'; // Uncommented
import { augmentSystemPrompt, AugmentResult } from '@/lib/ai/middleware/rag-middleware'; // Uncommented

export const maxDuration = 60; // Allow up to 60 seconds

// Type definitions for results
interface TestResult {
  step: string;
  status: 'started' | 'success' | 'error';
  data?: Record<string, unknown>;
}

/**
 * API route to test E.V.E.'s memory functions
 * Access via: /api/test-memory
 */
export async function GET() {
  console.log('🧠 E.V.E. Memory Test API - STARTING FULL TEST'); // Updated log
  const results: TestResult[] = [];
  const supabase = getSupabaseServerClient();

  try {
    // Step 1: Create some entities (Uncommented)
    results.push({ step: 'Creating project entity', status: 'started' });
    const { data: project, error: projectError } = await supabase
      .from('entities')
      .insert([{
        name: 'E.V.E. Development',
        type: 'project',
        data: {
          status: 'active',
          priority: 'high',
          description: 'Building an AI assistant with persistent memory'
        }
      }])
      .select('id, name, type')
      .single();

    if (projectError) {
      results.push({
        step: 'Creating project entity',
        status: 'error',
        data: { error: projectError.message }
      });
      throw new Error(`Error creating project: ${projectError.message}`);
    }

    results.push({
      step: 'Creating project entity',
      status: 'success',
      data: { id: project.id, name: project.name }
    });

    console.log(`Created project: ${project.name} (${project.id})`);

    // Create a person entity
    results.push({ step: 'Creating person entity', status: 'started' });
    const { data: person, error: personError } = await supabase
      .from('entities')
      .insert([{
        name: 'John Smith',
        type: 'person',
        data: {
          role: 'developer',
          skills: ['typescript', 'next.js', 'supabase'],
          email: 'john@example.com'
        }
      }])
      .select('id, name, type')
      .single();

    if (personError) {
      results.push({
        step: 'Creating person entity',
        status: 'error',
        data: { error: personError.message }
      });
      throw new Error(`Error creating person: ${personError.message}`);
    }

    results.push({
      step: 'Creating person entity',
      status: 'success',
      data: { id: person.id, name: person.name }
    });

    console.log(`Created person: ${person.name} (${person.id})`);

    // Create a task entity
    results.push({ step: 'Creating task entity', status: 'started' });
    const { data: task, error: taskError } = await supabase
      .from('entities')
      .insert([{
        name: 'Implement RAG',
        type: 'task',
        data: {
          status: 'completed',
          due_date: '2023-05-20',
          description: 'Implement Retrieval Augmented Generation for the assistant'
        }
      }])
      .select('id, name, type')
      .single();

    if (taskError) {
      results.push({
        step: 'Creating task entity',
        status: 'error',
        data: { error: taskError.message }
      });
      throw new Error(`Error creating task: ${taskError.message}`);
    }

    results.push({
      step: 'Creating task entity',
      status: 'success',
      data: { id: task.id, name: task.name }
    });

    console.log(`Created task: ${task.name} (${task.id})`);

    // Step 2: Create relations between entities (Uncommented)
    results.push({ step: 'Creating person-project relation', status: 'started' });
    const { data: relation1, error: relationError1 } = await supabase
      .from('relations')
      .insert([{
        source_entity_id: person.id,
        target_entity_id: project.id,
        type: 'works_on',
        data: { role: 'lead developer', started_at: '2023-04-01' }
      }])
      .select('id, type')
      .single();

    if (relationError1) {
      results.push({
        step: 'Creating person-project relation',
        status: 'error',
        data: { error: relationError1.message }
      });
      throw new Error(`Error creating relation: ${relationError1.message}`);
    }

    results.push({
      step: 'Creating person-project relation',
      status: 'success',
      data: { id: relation1.id, type: relation1.type }
    });

    console.log(`Created relation: ${person.name} works_on ${project.name} (${relation1.id})`);

    // Removed hardcoded project ID

    // Step 2.5 - Keep commented out for now
    /*
    results.push({ step: 'Clearing old knowledge data', status: 'started' });
    console.log('Test API: Attempting to clear old knowledge data...');
    const { error: deleteError } = await supabase
      .from('knowledge')
      .delete()
      .match({ source: 'memory_test_api' });

    console.log('Test API: Deletion attempt finished. Checking for deleteError...', deleteError);

    if (deleteError) {
       throw new Error(`Test API: Failed to clear old knowledge: ${deleteError.message}`);
    } else {
       console.log('Test API: Successfully cleared old knowledge data.');
    }
    */

    // Step 3: Add knowledge items (Restored)
    results.push({ step: 'Adding knowledge items', status: 'started' });
    console.log("Test API: Proceeding to knowledge insertion...");

    const knowledgeItems = [
      {
        content: `The E.V.E. project aims to create a helpful AI assistant. Key technologies include Next.js, TypeScript, Supabase for the database, and OpenAI for AI models. The RAG feature uses pgvector.`,
        entity_id: project.id, // Use dynamic project ID
        source: 'memory_test_api',
        metadata: { type: 'project_overview', tech: ['Next.js', 'TypeScript', 'Supabase', 'OpenAI', 'pgvector'] }
      },
      {
        content: `John Smith is the lead developer working on the E.V.E. project, specifically focusing on implementing the RAG (Retrieval Augmented Generation) memory system.`,
        entity_id: person.id, // Use dynamic person ID
        source: 'memory_test_api',
        metadata: { type: 'person_role', task: 'Implement RAG' }
      },
      {
        content: `The 'Implement RAG' task involves setting up vector embeddings (using OpenAI's text-embedding-3-large) and Supabase/pgvector for similarity search.`,
        entity_id: task.id, // Use dynamic task ID
        source: 'memory_test_api',
        metadata: { type: 'task_details', status: 'completed' }
      }
    ];

    let itemsAdded = 0;
    for (let i = 0; i < knowledgeItems.length; i++) {
      const item = knowledgeItems[i];
      console.log(`Processing knowledge item ${i + 1}/${knowledgeItems.length}...`);
      try {
        console.log(`Generating embedding for item ${i + 1}...`);
        const embedding = await generateEmbedding(item.content); // Use real embedding function
        console.log(`Embedding generated. Attempting insert for item ${i + 1}...`);

        const { data: knowledge, error: knowledgeError } = await supabase
          .from('knowledge')
          .insert([{
            content: item.content,
            embedding: embedding, // Use generated embedding
            entity_id: item.entity_id,
            source: item.source,
            metadata: item.metadata
          }])
          .select('id')
          .single();

        console.log(`Raw insert result for item ${i + 1}: data=`, knowledge, `error=`, knowledgeError);

        if (knowledgeError) {
          // Specific error handling as requested
          console.error(`Error adding knowledge item ${i + 1}:`, knowledgeError);
          throw new Error(`Failed to insert knowledge item ${i + 1}: ${knowledgeError.message}`);
        } else {
          console.log(`Successfully added knowledge item ${i + 1} (${knowledge?.id})`);
          itemsAdded++;
        }
      } catch (error) {
        // Catch errors from embedding generation or the explicit throw above
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({ step: `Adding Knowledge Item ${i + 1}`, status: 'error', data: { error: errorMessage } });
        console.error(`Failed processing knowledge item ${i + 1}:`, error);
        // Re-throw to stop the test as per original design intent inferred from report
        throw new Error(`Critical error during knowledge insertion (item ${i + 1}): ${errorMessage}`);
      }
    }
    results.push({ step: 'Adding knowledge items', status: 'success', data: { itemsAdded: itemsAdded } });
    console.log(`Successfully added ${itemsAdded} knowledge items.`);


    // Step 4: Search knowledge using the augmented prompt helper (Uncommented)
    const queries = [
      'What is E.V.E.?',
      'Who is working on the RAG feature?',
      'What technologies are used in this project?'
    ];

    const baseSystemPrompt = 'You are E.V.E., an AI assistant.'; // Example base prompt

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      results.push({ step: `Searching for "${query}"`, status: 'started' });

      try {
        console.log(`Test API: Calling augmentSystemPrompt for query: "${query.substring(0, 50)}..."`);

        // Call the refactored augmentSystemPrompt function
        const augmentResult: AugmentResult = await augmentSystemPrompt(
          baseSystemPrompt,
          query,
          {
            top_k: 3, // Adjust top_k if needed for testing
            initial_threshold: 0.7,
            expansion_count: 2
            // llm_model can be omitted to use default
          }
        );

        // Process the result from augmentSystemPrompt
        if (augmentResult.searchResults && augmentResult.searchResults.length > 0) {
          // Success: Found results
          const formattedResults = augmentResult.searchResults.map(r => ({
            content: r.content,
            similarity: r.similarity
          }));

          results.push({
            step: `Searching for "${query}"`,
            status: 'success',
            data: {
              count: augmentResult.searchResults.length,
              results: formattedResults,
              queryExpansionError: augmentResult.error // Include any non-fatal expansion error
            }
          });
          console.log(`Test API: Found ${augmentResult.searchResults.length} results for query: "${query}" via augmentSystemPrompt.`);
        } else {
          // Failure: No results found or search failed
          const finalErrorMsg = augmentResult.error ?? 'No results found by augmentSystemPrompt after trying all queries and thresholds';
          results.push({
            step: `Searching for "${query}"`,
            status: 'error',
            data: { error: finalErrorMsg }
          });
          console.log(`Test API: No results found or error for query: "${query}" via augmentSystemPrompt. Error: ${finalErrorMsg}`);
        }

      } catch (error) {
        // Catch errors from the augmentSystemPrompt call itself (e.g., fatal errors)
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({
          step: `Searching for "${query}"`,
          status: 'error',
          data: { error: `Fatal error during augmentSystemPrompt: ${errorMessage}` }
        });
        console.error(`Test API: Fatal error searching for "${query}":`, error);
        // Optional: Decide if a single search failure should stop the whole test
        // throw new Error(`Fatal error during search for "${query}": ${errorMessage}`);
      }
    }

    // Return Success Response
    console.log("Test API: Full test finished. Returning results."); // Updated log
    return NextResponse.json({
      status: 'success',
      message: 'Full memory test completed successfully', // Updated message
      results
    });

  } catch (error) { // Outer catch block
    console.error('CRITICAL Error in memory test API:', error); // Updated log
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown critical error',
        results // Include partial results if any
      },
      { status: 500 }
    );
  }
} 