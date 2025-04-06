// SpaceTimeDB MCP Server
// This server provides a bridge between MCP and SpaceTimeDB

// --- BEGIN DIAGNOSTIC LOGGING ---
console.error(`[SPACETIME_MCP] Script starting.`);
console.error(`[SPACETIME_MCP] process.cwd(): ${process.cwd()}`);
console.error(`[SPACETIME_MCP] __dirname: ${__dirname}`);
console.error(`[SPACETIME_MCP] Full argv: ${process.argv.join(' ')}`);
// --- END DIAGNOSTIC LOGGING ---

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// NOTE: Path to SpaceTimeDB executable is hardcoded for this specific setup.
// Consider making this configurable via environment variables for portability.
const SPACETIME_EXE = 'C:\\Users\\dkhay\\AppData\\Local\\SpacetimeDB\\spacetime.exe';
const spacetimeProcesses = {};

// MCP Protocol handler
process.stdin.setEncoding('utf8');

let buffer = '';
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  processBuffer();
});

function processBuffer() {
  // Use standard newline '\n' for MCP message separation
  const newlineIndex = buffer.indexOf('\n');
  if (newlineIndex !== -1) {
    const line = buffer.slice(0, newlineIndex);
    buffer = buffer.slice(newlineIndex + 1);
    
    try {
      const message = JSON.parse(line);
      handleMessage(message);
    } catch (error) {
      console.error(`Error parsing message: ${error}`);
    }
    
    processBuffer();
  }
}

async function handleMessage(message) {
  if (message.type === 'ping') {
    sendResponse(message.id, { type: 'pong' });
  } else if (message.type === 'invoke') {
    await handleInvoke(message);
  } else {
    console.error(`Unknown message type: ${message.type}`);
  }
}

async function handleInvoke(message) {
  const { id, name, params } = message;
  
  try {
    if (name === 'start_spacetime') {
      await startSpaceTime(id);
    } else if (name === 'publish_module') {
      await publishModule(id, params);
    } else if (name === 'create_entity') {
      await createEntity(id, params);
    } else {
      sendError(id, `Unknown method: ${name}`);
    }
  } catch (error) {
    sendError(id, error.message);
  }
}

async function startSpaceTime(messageId) {
  try {
    console.error('Attempting to start SpaceTimeDB...');
    // Kill any existing process
    if (spacetimeProcesses.server) {
      console.error('Killing existing SpaceTimeDB process...');
      spacetimeProcesses.server.kill();
      spacetimeProcesses.server = null;
    }

    console.error(`Spawning: cmd.exe /c "${SPACETIME_EXE}" start`);
    
    // Start SpaceTimeDB server using cmd.exe /c for better Windows compatibility
    const process = spawn('cmd.exe', ['/c', SPACETIME_EXE, 'start']);
    spacetimeProcesses.server = process;

    // Listen for spawn errors (e.g., command not found, permissions)
    process.on('error', (err) => {
      console.error(`Failed to start SpaceTimeDB process: ${err}`);
      sendError(messageId, `Spawn error for SpaceTimeDB: ${err.message}`); // Send error back to MCP client
      spacetimeProcesses.server = null; // Ensure we know the process failed
    });

    process.stdout.on('data', (data) => {
      const stdoutMsg = data.toString().trim();
      console.error(`SpaceTimeDB stdout: ${stdoutMsg}`);
      // Optionally, check stdout for specific success messages if needed
    });
    
    process.stderr.on('data', (data) => {
      const stderrMsg = data.toString().trim();
      console.error(`SpaceTimeDB stderr: ${stderrMsg}`);
      // Send critical stderr messages back as errors? Maybe too noisy.
    });
    
    process.on('close', (code) => {
      console.error(`SpaceTimeDB process exited with code ${code}`);
      if (spacetimeProcesses.server === process) { // Check if it's the same process we monitor
          spacetimeProcesses.server = null; // Clear reference if it closed
      }
      // If the process exits unexpectedly (non-zero code) shortly after start, report error
      if (code !== 0) {
        // Avoid sending error if we already sent a success response
        // This check is imperfect, might need a flag
        sendError(messageId, `SpaceTimeDB process exited unexpectedly with code ${code}`);
      }
    });

    // Wait a bit to ensure server starts
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    sendResponse(messageId, { success: true, message: 'SpaceTimeDB server started' });
  } catch (error) {
    sendError(messageId, `Failed to start SpaceTimeDB: ${error.message}`);
  }
}

async function publishModule(messageId, params) {
  const { module_name, project_path } = params;
  
  try {
    const process = spawn(SPACETIME_EXE, [
      'publish',
      '--project-path', project_path,
      module_name
    ]);
    
    let output = '';
    
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        sendResponse(messageId, { 
          success: true, 
          message: `Module ${module_name} published successfully`,
          output
        });
      } else {
        sendError(messageId, `Failed to publish module: ${output}`);
      }
    });
  } catch (error) {
    sendError(messageId, `Failed to publish module: ${error.message}`);
  }
}

async function createEntity(messageId, params) {
  // TODO: Implement actual interaction with the published SpaceTimeDB module.
  // This currently only simulates success.
  sendResponse(messageId, { 
    success: true, 
    message: `Entity ${params.name} created successfully (simulated)`,
    entity_id: generateId()
  });
}

function generateId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

function sendResponse(id, result) {
  const response = {
    id,
    result
  };
  // Use standard newline '\n' for MCP message separation
  process.stdout.write(JSON.stringify(response) + '\n');
}

function sendError(id, error) {
  const response = {
    id,
    error: {
      message: error
    }
  };
  // Use standard newline '\n' for MCP message separation
  process.stdout.write(JSON.stringify(response) + '\n');
}

// Cleanup on exit
process.on('exit', () => {
  if (spacetimeProcesses.server) {
    spacetimeProcesses.server.kill();
  }
});

console.error('SpaceTimeDB MCP Server started'); 