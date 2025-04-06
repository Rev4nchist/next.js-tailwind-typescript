# Integrating Eve Memory with Cursor

This document explains how to integrate the Eve Memory MCP server with Cursor IDE to give Eve (your AI assistant) persistent memory capabilities.

## Overview

Eve's memory system uses the Model Context Protocol (MCP) to provide persistent memory across all projects. This memory system allows Eve to:

1. Store entities, concepts, and their relationships
2. Recall information from previous sessions
3. Build and maintain a knowledge graph over time

## Setup Instructions

### 1. Install dependencies

```bash
# Install the required dependencies for the MCP server
npm install
```

### 2. Configure Cursor

Create a file called `mcp.json` in the `.cursor` directory of your project with the following content:

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

This tells Cursor to start the Eve Memory MCP server when the project is opened.

### 3. Verify the MCP server is running

When you open Cursor, the MCP server should automatically start. You can verify it's running by:

1. Checking the Cursor logs for a message like "Eve Memory MCP Server started"
2. Seeing if the `eve-memory-db` directory was created (it stores persistent memory)

## Using Eve's Memory

Eve's memory system provides several operations through MCP. Here are examples of how to use them:

### Creating entities

```
# Store information about a programming language
create_entity(
  name="Python",
  entity_type="programming_language",
  data_json='{"typing": "dynamic", "paradigm": "multi-paradigm", "created_by": "Guido van Rossum"}'
)

# Store a user preference
create_entity(
  name="UserPreference:Theme",
  entity_type="preference",
  data_json='{"value": "dark"}'
)
```

### Creating relationships

```
# First get entity IDs from create_entity responses
create_relation(
  source_entity_id="id-for-project-x",
  target_entity_id="id-for-python",
  relation_type="uses"
)
```

### Storing knowledge

```
# Store important information that isn't tied to a specific entity
create_knowledge(
  text_content="Eve's memory system is implemented using SpaceTimeDB and Node.js",
  tags_json='["eve", "memory", "architecture"]',
  source_identifier="system_documentation"
)
```

### Retrieving information

```
# Get an entity by name
get_entity_by_name(name="Python")

# Get all relations for an entity
get_relations_for_entity(entity_id="id-from-create-entity")

# Search knowledge by tags
search_knowledge_by_tags(tags=["memory", "architecture"])
```

## Implementation Notes

- All data in Eve's memory is stored persistently in the `eve-memory-db` directory
- Entity and knowledge data is stored as JSON strings for flexibility
- The memory system is still in development, with plans to add semantic search capabilities

## Removing Supabase MCP Integration

If you were previously using the Supabase MCP server for Eve's memory, you should remove it from your `.cursor/mcp.json` configuration to avoid conflicts:

```diff
{
  "mcpServers": {
-   "supabase-memory": {
-     "command": "node",
-     "args": ["supabase-memory-server.js"],
-     "env": {
-       "SUPABASE_URL": "your-supabase-url",
-       "SUPABASE_KEY": "your-supabase-key"
-     }
-   },
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

## Troubleshooting

If Eve's memory system is not working correctly, check the following:

1. Ensure the MCP server is running (check Cursor logs)
2. Verify that the `eve-memory-db` directory exists and has read/write permissions
3. Make sure you're using the correct method names and parameters in your MCP calls

For more detailed troubleshooting, look for error messages in the Cursor logs. 