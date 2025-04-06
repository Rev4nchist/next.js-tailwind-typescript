import { z } from 'zod';
import { tool } from 'ai';
import { getSupabaseServerClient } from '@/lib/supabase/client';
import { generateEmbedding } from '@/lib/ai/utils';
import { performSemanticSearch } from '@/lib/ai/middleware/rag-middleware';

// Zod schema for the addKnowledge tool input
const AddKnowledgeSchema = z.object({
  content: z.string().describe('The textual content of the knowledge to add.'),
  entity_id: z.string().uuid().optional().describe('Optional UUID of the entity this knowledge is primarily associated with.'),
  source: z.string().optional().describe('The source of the knowledge (e.g., document name, URL, conversation ID).'),
  metadata: z.record(z.any()).optional().describe('Optional JSON object for additional metadata.')
});

/**
 * AI Tool: Adds a piece of knowledge to the Supabase database,
 * including generating its embedding.
 */
export const addKnowledgeTool = tool({
  description: 'Adds a piece of textual knowledge to the memory database. Generates an embedding for semantic search.',
  parameters: AddKnowledgeSchema,
  execute: async ({ content, entity_id, source, metadata }) => {
    try {
      console.log(`Executing addKnowledgeTool: ${content.substring(0, 50)}...`);
      const embedding = await generateEmbedding(content);
      const supabase = getSupabaseServerClient();

      const { data, error } = await supabase
        .from('knowledge')
        .insert([
          {
            content,
            embedding,
            entity_id: entity_id ?? null,
            source: source ?? null,
            metadata: metadata ?? null,
          },
        ])
        .select('id') // Select the id of the inserted row
        .single(); // Expect a single row back

      if (error) {
        console.error('Supabase error in addKnowledgeTool:', error);
        throw new Error(`Supabase error: ${error.message}`);
      }

      if (!data) {
        throw new Error('Failed to insert knowledge, no data returned.');
      }

      console.log(`addKnowledgeTool successful. ID: ${data.id}`);
      return { success: true, knowledgeId: data.id, message: `Knowledge added successfully with ID ${data.id}.` };
    } catch (error) {
      console.error('Error executing addKnowledgeTool:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  },
});

// Zod schema for the createEntity tool input
const CreateEntitySchema = z.object({
  name: z.string().describe('The name of the entity (e.g., project name, person name).'),
  type: z.string().describe("The type of the entity (e.g., 'project', 'person', 'task', 'concept')."),
  data: z.record(z.any()).optional().describe('Optional JSON object for additional attributes specific to the entity type.')
});

/**
 * AI Tool: Creates a new entity record in the Supabase database.
 */
export const createEntityTool = tool({
  description: 'Creates a new entity (like a project, person, task, or concept) in the memory database.',
  parameters: CreateEntitySchema,
  execute: async ({ name, type, data: entityData }) => { // Renamed data to avoid conflict
    try {
      console.log(`Executing createEntityTool: Name=${name}, Type=${type}`);
      const supabase = getSupabaseServerClient();

      const { data, error } = await supabase
        .from('entities')
        .insert([
          {
            name,
            type,
            data: entityData ?? null, // Use the renamed variable
          },
        ])
        .select('id') // Select the id of the inserted row
        .single(); // Expect a single row back

      if (error) {
        console.error('Supabase error in createEntityTool:', error);
        throw new Error(`Supabase error: ${error.message}`);
      }

      if (!data) {
        throw new Error('Failed to create entity, no data returned.');
      }

      console.log(`createEntityTool successful. ID: ${data.id}`);
      return { success: true, entityId: data.id, message: `Entity '${name}' created successfully with ID ${data.id}.` };
    } catch (error) {
      console.error('Error executing createEntityTool:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  },
});

// Zod schema for the createRelation tool input
const CreateRelationSchema = z.object({
  source_entity_id: z.string().uuid().describe('The UUID of the source entity.'),
  target_entity_id: z.string().uuid().describe('The UUID of the target entity.'),
  type: z.string().describe("The type of relationship (e.g., 'depends_on', 'created_by', 'assigned_to')."),
  data: z.record(z.any()).optional().describe('Optional JSON object for additional attributes about the relationship.')
});

/**
 * AI Tool: Creates a relationship between two existing entities.
 */
export const createRelationTool = tool({
  description: 'Creates a directed relationship between two existing entities in the memory database.',
  parameters: CreateRelationSchema,
  execute: async ({ source_entity_id, target_entity_id, type, data: relationData }) => {
    try {
      console.log(`Executing createRelationTool: ${source_entity_id} -> ${type} -> ${target_entity_id}`);
      const supabase = getSupabaseServerClient();

      // Optional: Check if source and target entities exist before creating relation
      // const { count: sourceCount, error: sourceError } = await supabase.from('entities').select('id', { count: 'exact' }).eq('id', source_entity_id);
      // const { count: targetCount, error: targetError } = await supabase.from('entities').select('id', { count: 'exact' }).eq('id', target_entity_id);
      // if (sourceError || targetError || sourceCount !== 1 || targetCount !== 1) {
      //   throw new Error('Source or target entity not found.');
      // }

      const { data, error } = await supabase
        .from('relations')
        .insert([
          {
            source_entity_id,
            target_entity_id,
            type,
            data: relationData ?? null,
          },
        ])
        .select('id')
        .single();

      if (error) {
        console.error('Supabase error in createRelationTool:', error);
        throw new Error(`Supabase error: ${error.message}`);
      }

      if (!data) {
        throw new Error('Failed to create relation, no data returned.');
      }

      console.log(`createRelationTool successful. ID: ${data.id}`);
      return { success: true, relationId: data.id, message: `Relation created successfully with ID ${data.id}.` };
    } catch (error) {
      console.error('Error executing createRelationTool:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  },
});

// --- Retrieval Tools ---

// Zod schema for the findEntities tool input
const FindEntitiesSchema = z.object({
  name_query: z.string().optional().describe('A partial name to search for (case-insensitive search).'),
  type_filter: z.string().optional().describe("An optional entity type to filter by (e.g., 'project', 'person').")
});

/**
 * AI Tool: Finds entities based on name and/or type.
 */
export const findEntitiesTool = tool({
  description: 'Finds entities in the memory database by name query and/or type filter.',
  parameters: FindEntitiesSchema,
  execute: async ({ name_query, type_filter }) => {
    try {
      console.log(`Executing findEntitiesTool: Query=${name_query}, Type=${type_filter}`);
      const supabase = getSupabaseServerClient();
      let query = supabase.from('entities').select('id, name, type, created_at, data');

      if (name_query) {
        // Use 'ilike' for case-insensitive partial matching
        query = query.ilike('name', `%${name_query}%`);
      }
      if (type_filter) {
        query = query.eq('type', type_filter);
      }

      // Limit results for performance
      query = query.limit(10);

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error in findEntitiesTool:', error);
        throw new Error(`Supabase error: ${error.message}`);
      }

      console.log(`findEntitiesTool successful. Found ${data?.length || 0} entities.`);
      return { success: true, entities: data };
    } catch (error) {
      console.error('Error executing findEntitiesTool:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage, entities: [] };
    }
  },
});

// Zod schema for the findRelations tool input
const FindRelationsSchema = z.object({
  entity_id: z.string().uuid().describe('The UUID of the entity to find relations for.'),
  relation_type: z.string().optional().describe('Optional relation type to filter by (e.g., \'depends_on\').'),
  direction: z.enum(['source', 'target', 'both']).default('both').describe('Whether to find relations where the entity is the source, target, or both (default).')
});

/**
 * AI Tool: Finds relations connected to a specific entity.
 */
export const findRelationsTool = tool({
  description: 'Finds relations connected to a specific entity, optionally filtering by relation type and direction.',
  parameters: FindRelationsSchema,
  execute: async ({ entity_id, relation_type, direction }) => {
    try {
      console.log(`Executing findRelationsTool: Entity=${entity_id}, Type=${relation_type}, Direction=${direction}`);
      const supabase = getSupabaseServerClient();
      let query = supabase.from('relations').select('id, source_entity_id, target_entity_id, type, created_at, data');

      if (direction === 'source') {
        query = query.eq('source_entity_id', entity_id);
      } else if (direction === 'target') {
        query = query.eq('target_entity_id', entity_id);
      } else { // both
        query = query.or(`source_entity_id.eq.${entity_id},target_entity_id.eq.${entity_id}`);
      }

      if (relation_type) {
        query = query.eq('type', relation_type);
      }

      // Limit results
      query = query.limit(10);

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error in findRelationsTool:', error);
        throw new Error(`Supabase error: ${error.message}`);
      }

      console.log(`findRelationsTool successful. Found ${data?.length || 0} relations.`);
      return { success: true, relations: data };
    } catch (error) {
      console.error('Error executing findRelationsTool:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage, relations: [] };
    }
  },
});

// Zod schema for the semanticSearchKnowledge tool input
const SemanticSearchSchema = z.object({
  query_text: z.string().describe('The natural language query to search for relevant knowledge.'),
  entity_id_filter: z.string().uuid().optional().describe('Optional UUID of an entity to restrict the search to.'),
  top_k: z.number().int().positive().default(5).describe('The maximum number of relevant knowledge snippets to return (default 5).'),
  match_threshold: z.number().min(0).max(1).default(0.7).describe('Minimum similarity threshold (cosine similarity) for results (default 0.7).')
});

/**
 * AI Tool: Performs semantic search on the knowledge base using vector similarity.
 */
export const semanticSearchKnowledgeTool = tool({
  description: 'Searches the knowledge base for text snippets semantically similar to the query text using vector embeddings.',
  parameters: SemanticSearchSchema,
  execute: async ({ query_text, entity_id_filter, top_k, match_threshold }) => {
    try {
      console.log(`Executing semanticSearchKnowledgeTool: Query=${query_text.substring(0, 50)}..., TopK=${top_k}, Threshold=${match_threshold}`);
      
      // Use the shared performSemanticSearch function
      const { success, results, error } = await performSemanticSearch(
        query_text,
        top_k,
        match_threshold,
        entity_id_filter ? entity_id_filter : null
      );

      if (!success) {
        console.error('Error in semanticSearchKnowledgeTool:', error);
        return { success: false, error, results: [] };
      }

      console.log(`semanticSearchKnowledgeTool successful. Found ${results?.length || 0} matches.`);
      // Return only relevant fields, not the full embedding
      const formattedResults = results?.map((item) => ({ 
        id: item.id,
        content: item.content,
        similarity: item.similarity,
        entity_id: item.entity_id,
        source: item.source,
        created_at: item.created_at
      })) || [];

      return { success: true, results: formattedResults };
    } catch (error) {
      console.error('Error executing semanticSearchKnowledgeTool:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage, results: [] };
    }
  },
});

// --- End of memory tools --- 