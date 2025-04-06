# Eve Memory System

This project implements a comprehensive memory system for Eve, a personal assistant with global memory capabilities. The system uses a hybrid approach combining SpaceTimeDB, MCP servers, and persistent storage.

## Architecture

The Eve Memory System consists of these components:

1. **Database Schema** - Defined in the SpaceTimeDB module (`eve_memory_module/`)
   - `EveGlobalEntity`: Stores entities and concepts
   - `EveGlobalRelation`: Stores relationships between entities
   - `EveGlobalKnowledge`: Stores knowledge snippets

2. **MCP Servers** - Multiple servers for different functions:
   - `eve-memory-mcp-server.js`: Primary memory MCP server
   - `spacetime-mcp-server.js`: SpaceTimeDB interaction server
   - Other standard MCP servers (sequential-thinking, browserbase, etc.)

3. **Persistent Storage** - File-based storage implemented in `eve-memory-store.js`

## Setup Instructions

### 1. Local Project Setup

The local MCP configuration is already set up in `.cursor/mcp.json`. This configuration includes:
- MCP Search
- Sequential Thinking
- Eve Memory
- SpaceTimeDB
- Browserbase

### 2. Global MCP Setup

For Eve's memory to work across all projects, you need to update your global MCP configuration.
Follow the instructions in `GLOBAL_MCP_UPDATE.md`.

### 3. SpaceTimeDB Setup

SpaceTimeDB is running on your system at http://localhost:3000. The SpaceTimeDB module is ready to be published.

## Usage

### Working with Entities

Entities represent concepts, people, objects, or any other discrete items that Eve should remember:

```javascript
// Create a new entity
const entityId = await createEntity({
  name: "Project X",
  entity_type: "project",
  data_json: JSON.stringify({
    description: "AI research project",
    priority: "high",
    deadline: "2023-12-31"
  })
});
```

### Working with Relations

Relations connect entities to each other:

```javascript
// Create a relation between entities
const relationId = await createRelation({
  source_entity_id: "entity1",
  target_entity_id: "entity2",
  relation_type: "depends_on"
});
```

### Working with Knowledge

Knowledge represents information snippets:

```javascript
// Store knowledge
const knowledgeId = await storeKnowledge({
  entity_id: "entity1",
  knowledge_text: "This project requires Python 3.9 or higher",
  source: "requirements.txt",
  importance: 0.8
});
```

## Implementation Files

- `eve_memory_module/src/lib.rs`: SpaceTimeDB module schema
- `eve-memory-mcp-server.js`: Eve Memory MCP server
- `eve-memory-store.js`: Persistent storage implementation
- `spacetime-mcp-server.js`: SpaceTimeDB MCP server
- `.cursor/mcp.json`: Local MCP configuration
- `.cursor/spacetime-mcp.json`: SpaceTimeDB MCP schema

## Future Improvements

- Vector embeddings for semantic search
- Advanced knowledge graph capabilities
- Memory consolidation features
- Enhanced query capabilities 