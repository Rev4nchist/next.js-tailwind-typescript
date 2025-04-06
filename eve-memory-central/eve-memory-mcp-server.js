// --- BEGIN DIAGNOSTIC LOGGING ---
console.error(`[EVE_MEMORY_MCP] Script starting.`);
console.error(`[EVE_MEMORY_MCP] process.cwd(): ${process.cwd()}`);
console.error(`[EVE_MEMORY_MCP] __dirname: ${__dirname}`);
console.error(`[EVE_MEMORY_MCP] Full argv: ${process.argv.join(' ')}`);
console.error(`[EVE_MEMORY_MCP] process.env.MEMORY_DB_PATH: ${process.env.MEMORY_DB_PATH}`);
// --- END DIAGNOSTIC LOGGING ---

// Eve Memory MCP Server
// This server provides memory capabilities to Eve personal assistant via MCP protocol

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const MemoryStore = require('./eve-memory-store');

// Get storage path from env or use default central location
const storagePath = process.env.MEMORY_DB_PATH || path.join(__dirname, 'eve-memory-db');
const store = new MemoryStore(storagePath);

// Generate unique IDs for entities, relations, and knowledge
function generateId() {
  return crypto.randomUUID();
}

// MCP Protocol handler
process.stdin.setEncoding('utf8');

let buffer = '';
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  processBuffer();
});

function processBuffer() {
  const newlineIndex = buffer.indexOf('\\n');
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
    if (name === 'create_entity') {
      await createEntity(id, params);
    } else if (name === 'get_entity') {
      await getEntity(id, params);
    } else if (name === 'update_entity') {
      await updateEntity(id, params);
    } else if (name === 'delete_entity') {
      await deleteEntity(id, params);
    } else if (name === 'create_relation') {
      await createRelation(id, params);
    } else if (name === 'get_relation') {
      await getRelation(id, params);
    } else if (name === 'create_knowledge') {
      await createKnowledge(id, params);
    } else if (name === 'get_knowledge') {
      await getKnowledge(id, params);
    } else if (name === 'search_entities') {
      await searchEntities(id, params);
    } else {
      sendError(id, `Unknown method: ${name}`);
    }
  } catch (error) {
    sendError(id, error.message);
  }
}

async function createEntity(messageId, params) {
  try {
    const entityId = generateId();
    const timestamp = new Date();
    
    const entity = {
      entity_id: entityId,
      name: params.name,
      entity_type: params.entity_type || null,
      data_json: params.data_json || null,
      embedding_json: params.embedding_json || null,
      created_at: timestamp,
      updated_at: timestamp
    };
    
    store.entities[entityId] = entity;
    await store.saveEntities();
    
    sendResponse(messageId, { 
      success: true, 
      entity_id: entityId,
      entity: entity
    });
  } catch (error) {
    sendError(messageId, `Failed to create entity: ${error.message}`);
  }
}

async function getEntity(messageId, params) {
  try {
    const { entity_id, name } = params;
    
    let entity = null;
    
    if (entity_id) {
      entity = store.entities[entity_id];
    } else if (name) {
      entity = Object.values(store.entities).find(e => e.name === name);
    }
    
    if (!entity) {
      sendError(messageId, `Entity not found`);
      return;
    }
    
    sendResponse(messageId, { 
      success: true, 
      entity: entity
    });
  } catch (error) {
    sendError(messageId, `Failed to get entity: ${error.message}`);
  }
}

async function updateEntity(messageId, params) {
  try {
    const { entity_id, ...updates } = params;
    
    if (!entity_id) {
      sendError(messageId, 'Entity ID is required');
      return;
    }
    
    const entity = store.entities[entity_id];
    
    if (!entity) {
      sendError(messageId, `Entity not found`);
      return;
    }
    
    // Update fields
    Object.assign(entity, {
      ...updates,
      updated_at: new Date()
    });
    
    await store.saveEntities();
    
    sendResponse(messageId, { 
      success: true, 
      entity: entity
    });
  } catch (error) {
    sendError(messageId, `Failed to update entity: ${error.message}`);
  }
}

async function deleteEntity(messageId, params) {
  try {
    const { entity_id } = params;
    
    if (!entity_id) {
      sendError(messageId, 'Entity ID is required');
      return;
    }
    
    if (!store.entities[entity_id]) {
      sendError(messageId, `Entity not found`);
      return;
    }
    
    delete store.entities[entity_id];
    await store.saveEntities();
    
    sendResponse(messageId, { 
      success: true
    });
  } catch (error) {
    sendError(messageId, `Failed to delete entity: ${error.message}`);
  }
}

async function createRelation(messageId, params) {
  try {
    const relationId = generateId();
    const timestamp = new Date();
    
    const relation = {
      relation_id: relationId,
      source_entity_id: params.source_entity_id,
      target_entity_id: params.target_entity_id,
      relation_type: params.relation_type,
      created_at: timestamp
    };
    
    store.relations[relationId] = relation;
    await store.saveRelations();
    
    sendResponse(messageId, { 
      success: true, 
      relation_id: relationId,
      relation: relation
    });
  } catch (error) {
    sendError(messageId, `Failed to create relation: ${error.message}`);
  }
}

async function getRelation(messageId, params) {
  try {
    const { relation_id } = params;
    
    const relation = store.relations[relation_id];
    
    if (!relation) {
      sendError(messageId, `Relation not found`);
      return;
    }
    
    sendResponse(messageId, { 
      success: true, 
      relation: relation
    });
  } catch (error) {
    sendError(messageId, `Failed to get relation: ${error.message}`);
  }
}

async function createKnowledge(messageId, params) {
  try {
    const knowledgeId = generateId();
    const timestamp = new Date();
    
    const knowledge = {
      knowledge_id: knowledgeId,
      entity_id: params.entity_id,
      knowledge_text: params.knowledge_text,
      source: params.source || null,
      importance: params.importance || 0.5,
      metadata_json: params.metadata_json || null,
      created_at: timestamp
    };
    
    store.knowledge[knowledgeId] = knowledge;
    await store.saveKnowledge();
    
    sendResponse(messageId, { 
      success: true, 
      knowledge_id: knowledgeId,
      knowledge: knowledge
    });
  } catch (error) {
    sendError(messageId, `Failed to create knowledge: ${error.message}`);
  }
}

async function getKnowledge(messageId, params) {
  try {
    const { knowledge_id } = params;
    
    const knowledge = store.knowledge[knowledge_id];
    
    if (!knowledge) {
      sendError(messageId, `Knowledge not found`);
      return;
    }
    
    sendResponse(messageId, { 
      success: true, 
      knowledge: knowledge
    });
  } catch (error) {
    sendError(messageId, `Failed to get knowledge: ${error.message}`);
  }
}

async function searchEntities(messageId, params) {
  try {
    const { query, entity_type } = params;
    
    let results = Object.values(store.entities);
    
    if (entity_type) {
      results = results.filter(entity => entity.entity_type === entity_type);
    }
    
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(entity => 
        entity.name.toLowerCase().includes(lowerQuery) || 
        (entity.data_json && entity.data_json.toLowerCase().includes(lowerQuery))
      );
    }
    
    sendResponse(messageId, { 
      success: true, 
      results: results
    });
  } catch (error) {
    sendError(messageId, `Failed to search entities: ${error.message}`);
  }
}

function sendResponse(id, result) {
  const response = {
    id,
    result
  };
  process.stdout.write(JSON.stringify(response) + '\\n');
}

function sendError(id, error) {
  const response = {
    id,
    error: {
      message: error
    }
  };
  process.stdout.write(JSON.stringify(response) + '\\n');
}

console.error('Eve Memory MCP Server started'); 