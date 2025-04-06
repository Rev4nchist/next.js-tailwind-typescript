import { getSupabaseServerClient } from '../lib/supabase/client';
import { generateEmbedding } from '../lib/ai/utils';
import { performSemanticSearch, KnowledgeResult } from '../lib/ai/middleware/rag-middleware';

/**
 * Test script to demonstrate E.V.E.'s memory functions by:
 * 1. Creating sample entities (projects, people)
 * 2. Creating relations between entities
 * 3. Adding knowledge items
 * 4. Performing semantic search
 * 
 * Run with: npx tsx src/scripts/test-memory.ts
 */

async function testMemoryFunctions() {
  console.log('🧠 E.V.E. Memory Test Script');
  console.log('============================\n');
  
  const supabase = getSupabaseServerClient();
  
  try {
    // Step 1: Create some sample entities
    console.log('📦 Creating sample entities...');
    
    // Create a project entity
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
      .select('id, name, type, data')
      .single();
    
    if (projectError) throw new Error(`Error creating project: ${projectError.message}`);
    console.log(`Created project: ${project.name} (${project.id})`);
    
    // Create a person entity
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
      .select('id, name, type, data')
      .single();
    
    if (personError) throw new Error(`Error creating person: ${personError.message}`);
    console.log(`Created person: ${person.name} (${person.id})`);
    
    // Create a task entity
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
      .select('id, name, type, data')
      .single();
    
    if (taskError) throw new Error(`Error creating task: ${taskError.message}`);
    console.log(`Created task: ${task.name} (${task.id})`);
    
    // Step 2: Create relations between entities
    console.log('\n🔗 Creating relations between entities...');
    
    // Person is assigned to project
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
    
    if (relationError1) throw new Error(`Error creating relation: ${relationError1.message}`);
    console.log(`Created relation: ${person.name} works_on ${project.name} (${relation1.id})`);
    
    // Task belongs to project
    const { data: relation2, error: relationError2 } = await supabase
      .from('relations')
      .insert([{
        source_entity_id: task.id,
        target_entity_id: project.id,
        type: 'belongs_to',
        data: { priority: 'high' }
      }])
      .select('id, type')
      .single();
    
    if (relationError2) throw new Error(`Error creating relation: ${relationError2.message}`);
    console.log(`Created relation: ${task.name} belongs_to ${project.name} (${relation2.id})`);
    
    // Person is assigned to task
    const { data: relation3, error: relationError3 } = await supabase
      .from('relations')
      .insert([{
        source_entity_id: person.id,
        target_entity_id: task.id,
        type: 'assigned_to',
        data: { assigned_at: '2023-04-15' }
      }])
      .select('id, type')
      .single();
    
    if (relationError3) throw new Error(`Error creating relation: ${relationError3.message}`);
    console.log(`Created relation: ${person.name} assigned_to ${task.name} (${relation3.id})`);
    
    // Step 3: Add some knowledge items
    console.log('\n📚 Adding knowledge items...');
    
    // Knowledge about the project
    const projectKnowledge = [
      `E.V.E. stands for Elevated Virtual Essence, an AI assistant with persistent memory capabilities.`,
      `The E.V.E. project uses Next.js, TypeScript, Tailwind CSS, and Supabase with pgvector for the backend.`,
      `RAG (Retrieval Augmented Generation) is a key feature of E.V.E., allowing it to search its memory for relevant information.`,
      `E.V.E. can store entities like people, projects, and tasks, and create relationships between them.`,
      `John is developing the RAG feature for E.V.E. to help it remember conversations and facts.`
    ];
    
    // Add each knowledge item with an embedding
    for (const content of projectKnowledge) {
      // Generate embedding for semantic search
      const embedding = await generateEmbedding(content);
      
      // Insert into knowledge table
      const { data: knowledge, error: knowledgeError } = await supabase
        .from('knowledge')
        .insert([{
          content,
          embedding,
          entity_id: project.id, // Associate with the project
          source: 'memory_test',
          metadata: { type: 'project_info', created_by: 'test_script' }
        }])
        .select('id, content')
        .single();
      
      if (knowledgeError) throw new Error(`Error adding knowledge: ${knowledgeError.message}`);
      console.log(`Added knowledge: "${content.substring(0, 50)}..." (${knowledge.id})`);
    }
    
    // Step 4: Perform semantic search
    console.log('\n🔎 Performing semantic search...');
    
    const queries = [
      'What is E.V.E.?',
      'Who is working on the RAG feature?',
      'What technologies are used in this project?',
      'Tell me about John'
    ];
    
    for (const query of queries) {
      console.log(`\nQuery: "${query}"`);
      const searchResult = await performSemanticSearch(query, 3, 0.7);
      
      if (searchResult.success && searchResult.results.length > 0) {
        console.log(`Found ${searchResult.results.length} results:`);
        searchResult.results.forEach((result: KnowledgeResult, index) => {
          console.log(`  ${index + 1}. [${result.similarity.toFixed(3)}] "${result.content}"`);
        });
      } else {
        console.log(`No results found or error: ${searchResult.error || 'No matches above threshold'}`);
      }
    }
    
    // Step 5: Find entities and relations
    console.log('\n👥 Finding entities by name...');
    const { data: foundEntities, error: findError } = await supabase
      .from('entities')
      .select('id, name, type, data')
      .ilike('name', '%EVE%');
    
    if (findError) throw new Error(`Error finding entities: ${findError.message}`);
    console.log(`Found ${foundEntities.length} entities:`);
    foundEntities.forEach(entity => {
      console.log(`  - ${entity.name} (${entity.type})`);
    });
    
    console.log('\n🔗 Finding relations for John...');
    const { data: foundRelations, error: relError } = await supabase
      .from('relations')
      .select(`
        id, type, data,
        source:source_entity_id(id, name, type),
        target:target_entity_id(id, name, type)
      `)
      .eq('source_entity_id', person.id);
    
    if (relError) throw new Error(`Error finding relations: ${relError.message}`);
    console.log(`Found ${foundRelations.length} relations:`);
    
    // Properly type and access the relation properties
    interface RelationWithEntities {
      id: string;
      type: string;
      data: Record<string, any>;
      source: { id: string; name: string; type: string };
      target: { id: string; name: string; type: string };
    }

    foundRelations.forEach((relation: RelationWithEntities) => {
      console.log(`  - ${relation.source.name} ${relation.type} ${relation.target.name}`);
    });
    
    console.log('\n✅ Memory test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error in memory test:', error);
  }
}

// Run the test
testMemoryFunctions(); 