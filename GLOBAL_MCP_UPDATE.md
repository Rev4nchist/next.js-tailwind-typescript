# Global MCP Configuration Update

To update your global Cursor MCP configuration, follow these steps:

1. Navigate to your Cursor configuration directory: `C:\Users\dkhay\.cursor`
2. Open the `mcp.json` file in a text editor
3. Replace the contents with the following configuration:

```json
{
  "mcpServers": {
    "mcp-search": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-search"
      ]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sequential-thinking"
      ]
    },
    "eve-memory": {
      "command": "node",
      "args": ["eve-memory-mcp-server.js"],
      "env": {
        "MEMORY_DB_PATH": "eve-memory-db",
        "MEMORY_MODULE_PATH": "eve_memory_module"
      }
    },
    "spacetime": {
      "command": "node",
      "args": ["spacetime-mcp-server.js"]
    },
    "mcp-browserbase": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "@smithery/cli@latest",
        "run",
        "@browserbasehq/mcp-browserbase",
        "--key",
        "7b9b74c8-5ead-4afd-8434-711762ea51e2"
      ]
    }
  }
}
```

4. Save the file
5. Restart Cursor for the changes to take effect

## Important Notes

- This configuration removes the Supabase MCP server and replaces it with the Eve Memory and SpaceTimeDB MCP servers
- The Eve Memory MCP server provides memory capabilities across all projects
- The SpaceTimeDB MCP server enables interaction with SpaceTimeDB for database functionality
- The other MCP servers (mcp-search, sequential-thinking, and mcp-browserbase) are preserved

## Required Files

Make sure these files are in your project directory:
- `eve-memory-mcp-server.js`
- `spacetime-mcp-server.js`
- `eve-memory-store.js`

If running this in a different project, you may need to copy these files to that project or set up a global location for them. 