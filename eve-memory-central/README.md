# Eve Personal Assistant Memory System

This is a centralized memory system for Eve (Elevated Virtual Essence), your personal assistant in Cursor. This system allows Eve to maintain memory that persists across different projects and sessions.

## Overview

Eve's memory system is designed to be centralized at `C:\EVE\Eve Personal Assistant\` and consists of:

1. **Memory Database** - Stores entities, relations, and knowledge
2. **MCP Servers** - Connect Eve to the memory system via the Model Context Protocol (MCP)
3. **SpaceTimeDB Integration** - Advanced database capabilities for future expansion

## Setup Instructions

### 1. One-Time Setup

1. Copy the entire `eve-memory-central` directory to `C:\EVE\Eve Personal Assistant\`

```powershell
# Create the directory if it doesn't exist
if (-not (Test-Path "C:\EVE\Eve Personal Assistant")) {
    New-Item -Path "C:\EVE\Eve Personal Assistant" -ItemType Directory
}

# Copy all the files
Copy-Item -Path "eve-memory-central\*" -Destination "C:\EVE\Eve Personal Assistant\" -Recurse
```

2. Copy your global Cursor MCP configuration:

```powershell
# Back up existing configuration
if (Test-Path "C:\Users\dkhay\.cursor\mcp.json") {
    Copy-Item -Path "C:\Users\dkhay\.cursor\mcp.json" -Destination "C:\Users\dkhay\.cursor\mcp.json.backup"
}

# Copy new configuration
Copy-Item -Path "C:\EVE\Eve Personal Assistant\cursor-mcp.json" -Destination "C:\Users\dkhay\.cursor\mcp.json"
```

3. Install required Node.js dependencies:

```powershell
cd "C:\EVE\Eve Personal Assistant"
npm init -y
npm install uuid
```

### 2. Accessing Eve's Memory

Eve now has a persistent memory system available in any Cursor project. The memory system includes:

- **Entity Management**: Create and retrieve information about entities (people, projects, technologies)
- **Relation Tracking**: Maintain connections between entities (e.g., "Project X depends on Technology Y")
- **Knowledge Storage**: Store and retrieve information snippets related to entities

## Technical Details

### File Structure

```
C:\EVE\Eve Personal Assistant\
├── eve-memory-mcp-server.js   # Primary memory MCP server
├── eve-memory-store.js        # Persistent file-based storage
├── spacetime-mcp-server.js    # SpaceTimeDB integration
├── eve-mcp.json               # Eve memory MCP schema
├── spacetime-mcp.json         # SpaceTimeDB MCP schema
├── cursor-mcp.json            # Global Cursor MCP configuration
└── eve-memory-db\             # Persistent memory storage
    ├── entities.json          # Stored entities
    ├── relations.json         # Stored relations
    └── knowledge.json         # Stored knowledge
```

### MCP Configuration

The global MCP configuration (`C:\Users\dkhay\.cursor\mcp.json`) includes five essential MCP servers:

1. **mcp-search**: Standard search capabilities
2. **sequential-thinking**: Enhanced reasoning capabilities
3. **eve-memory**: Eve's global memory system
4. **spacetime**: SpaceTimeDB integration
5. **mcp-browserbase**: Web browsing capabilities

### Memory System Schema

The memory system uses three main tables:

1. **Entities**: 
   - Represent discrete concepts, people, projects, etc.
   - Attributes include ID, name, type, and JSON data

2. **Relations**: 
   - Connect entities to each other
   - Define relationships like "depends_on", "created_by", etc.

3. **Knowledge**: 
   - Store information snippets linked to entities
   - Include metadata like source and importance

## Usage Examples

Eve can now maintain memory across your projects. Some examples:

```javascript
// Create a project entity
const projectId = await createEntity({
  name: "Eve Memory System",
  entity_type: "project",
  data_json: JSON.stringify({
    description: "Global memory system for Eve personal assistant",
    status: "active",
    priority: "high"
  })
});

// Link two entities
await createRelation({
  source_entity_id: projectId,
  target_entity_id: techId,
  relation_type: "uses_technology"
});

// Store knowledge about a project
await createKnowledge({
  entity_id: projectId,
  knowledge_text: "The Eve Memory System uses file-based storage with future plans for SpaceTimeDB integration",
  source: "documentation",
  importance: 0.8
});
```

## Troubleshooting

If Eve's memory system isn't working:

1. Verify the MCP configuration is correctly installed in `C:\Users\dkhay\.cursor\mcp.json`
2. Check that all files are present in `C:\EVE\Eve Personal Assistant\`
3. Ensure Node.js is installed and the necessary dependencies are installed
4. Restart Cursor to apply configuration changes

## Future Improvements

- Vector embeddings for semantic search
- Advanced knowledge graph capabilities
- Integration with natural language processing
- Memory consolidation and prioritization
- Enhanced SpaceTimeDB integration 