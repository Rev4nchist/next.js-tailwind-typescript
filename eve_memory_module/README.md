# Eve Memory System

This module defines the memory system for Eve, a personal assistant with global memory capabilities.

## Architecture

The Eve Memory System consists of two main components:

1. **Eve Memory Module** - A SpaceTimeDB module that defines the database schema for Eve's memory
2. **Eve Memory MCP Server** - A Node.js server that implements the MCP protocol to connect Eve with the memory storage

### Database Schema

The memory system uses three main tables:

1. **EveGlobalEntity**: Stores entities/concepts with the following fields:
   - `entity_id` (primary key): Unique identifier
   - `name` (unique): Entity name
   - `entity_type` (optional): Categorization
   - `data_json` (optional): Flexible data field (JSON string)
   - `embedding_json` (optional): Vector embedding for semantic search (JSON string)
   - `created_at` & `updated_at`: Timestamps

2. **EveGlobalRelation**: Stores relationships between entities:
   - `relation_id` (primary key): Unique identifier
   - `source_entity_id` & `target_entity_id`: Foreign keys to entities
   - `relation_type`: Describes relationship (e.g., "uses", "owns")
   - `created_at`: Timestamp

3. **EveGlobalKnowledgeBase**: Stores larger chunks of knowledge:
   - `knowledge_id` (primary key): Unique identifier
   - `text_content`: Main content
   - `embedding_json` (optional): Vector embedding (JSON string)
   - `tags_json` (optional): For filtering/categorization (JSON string)
   - `source_identifier` (optional): Origin information
   - `created_at`: Timestamp

### MCP Server

The MCP server provides the following operations:

- **create_entity**: Create a new entity in Eve's memory
- **update_entity**: Update an existing entity
- **create_relation**: Create a relationship between entities
- **create_knowledge**: Add a new knowledge entry
- **get_entity_by_name**: Retrieve an entity by name
- **get_relations_for_entity**: Get all relations for an entity
- **search_knowledge_by_tags**: Search knowledge entries by tags

## Setup

1. **Install dependencies:**
   ```
   npm install
   ```

2. **Configure Cursor for MCP:**
   
   The `.cursor/mcp.json` file should contain:
   ```json
   {
     "mcpServers": {
       "eve-memory": {
         "command": "node",
         "args": ["eve-memory-mcp-server.js"],
         "env": {
           "MEMORY_DB_PATH": "eve-memory-db",
           "MEMORY_MODULE_PATH": "eve_memory_module"
         }
       }
     }
   }
   ```

3. **Start using Eve's memory in Cursor:**
   
   Eve now has persistent memory capabilities. Example memory operations:
   
   ```
   # Store a concept in memory
   create_entity(name="Python", entity_type="programming_language", data_json='{"typing": "dynamic", "paradigm": "multi-paradigm"}')
   
   # Create a relationship
   create_relation(source_entity_id="...", target_entity_id="...", relation_type="uses")
   
   # Store knowledge
   create_knowledge(text_content="Eve is built with a global memory system for persistent recall.", tags_json='["memory", "architecture"]')
   ```

## Implementation Details

- The memory system uses JSON strings for flexible data storage, including embedding vectors for future semantic search capabilities.
- The MCP server is language-agnostic and can connect to different storage backends.
- Currently, the system uses in-memory storage by default but is designed to integrate with SpaceTimeDB once deployment issues are resolved.

## Future Enhancements

1. Implement vector embedding generation for semantic search
2. Add persistent storage with SpaceTimeDB
3. Create a dynamic memory scaffold that adapts to different user contexts
4. Implement automatic memory summarization and pruning 