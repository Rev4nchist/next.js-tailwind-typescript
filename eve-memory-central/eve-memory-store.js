// Eve Memory Store - Persistence module for Eve Memory MCP Server
const fs = require('fs');
const path = require('path');

class MemoryStore {
  constructor(storePath = './eve-memory-db') {
    this.storePath = storePath;
    this.entities = {};
    this.relations = {};
    this.knowledge = {};
    
    this.init();
  }
  
  init() {
    try {
      // Create directory if it doesn't exist
      if (!fs.existsSync(this.storePath)) {
        fs.mkdirSync(this.storePath, { recursive: true });
        console.error(`Created memory store directory: ${this.storePath}`);
      }
      
      // Load entities if file exists
      const entitiesPath = path.join(this.storePath, 'entities.json');
      if (fs.existsSync(entitiesPath)) {
        this.entities = JSON.parse(fs.readFileSync(entitiesPath, 'utf8'));
        console.error(`Loaded ${Object.keys(this.entities).length} entities from store`);
      }
      
      // Load relations if file exists
      const relationsPath = path.join(this.storePath, 'relations.json');
      if (fs.existsSync(relationsPath)) {
        this.relations = JSON.parse(fs.readFileSync(relationsPath, 'utf8'));
        console.error(`Loaded ${Object.keys(this.relations).length} relations from store`);
      }
      
      // Load knowledge if file exists
      const knowledgePath = path.join(this.storePath, 'knowledge.json');
      if (fs.existsSync(knowledgePath)) {
        this.knowledge = JSON.parse(fs.readFileSync(knowledgePath, 'utf8'));
        console.error(`Loaded ${Object.keys(this.knowledge).length} knowledge items from store`);
      }
    } catch (error) {
      console.error(`Error initializing memory store: ${error.message}`);
    }
  }
  
  async saveEntities() {
    try {
      const entitiesPath = path.join(this.storePath, 'entities.json');
      await fs.promises.writeFile(entitiesPath, JSON.stringify(this.entities, null, 2));
      console.error(`Saved ${Object.keys(this.entities).length} entities to store`);
    } catch (error) {
      console.error(`Error saving entities: ${error.message}`);
      throw error;
    }
  }
  
  async saveRelations() {
    try {
      const relationsPath = path.join(this.storePath, 'relations.json');
      await fs.promises.writeFile(relationsPath, JSON.stringify(this.relations, null, 2));
      console.error(`Saved ${Object.keys(this.relations).length} relations to store`);
    } catch (error) {
      console.error(`Error saving relations: ${error.message}`);
      throw error;
    }
  }
  
  async saveKnowledge() {
    try {
      const knowledgePath = path.join(this.storePath, 'knowledge.json');
      await fs.promises.writeFile(knowledgePath, JSON.stringify(this.knowledge, null, 2));
      console.error(`Saved ${Object.keys(this.knowledge).length} knowledge items to store`);
    } catch (error) {
      console.error(`Error saving knowledge: ${error.message}`);
      throw error;
    }
  }
  
  // Get entity by ID
  getEntity(entityId) {
    return this.entities[entityId];
  }
  
  // Find entity by name
  findEntityByName(name) {
    return Object.values(this.entities).find(entity => entity.name === name);
  }
  
  // Get relations for an entity
  getRelationsForEntity(entityId) {
    return Object.values(this.relations).filter(relation => 
      relation.source_entity_id === entityId || relation.target_entity_id === entityId
    );
  }
  
  // Get knowledge for an entity
  getKnowledgeForEntity(entityId) {
    return Object.values(this.knowledge).filter(k => k.entity_id === entityId);
  }
  
  // Search entities by text
  searchEntities(searchText, entityType = null) {
    const lowerSearch = searchText.toLowerCase();
    let results = Object.values(this.entities);
    
    if (entityType) {
      results = results.filter(entity => entity.entity_type === entityType);
    }
    
    return results.filter(entity => 
      entity.name.toLowerCase().includes(lowerSearch) || 
      (entity.data_json && entity.data_json.toLowerCase().includes(lowerSearch))
    );
  }
}

module.exports = MemoryStore; 