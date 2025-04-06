use spacetimedb::{spacetimedb, ReducerContext, Timestamp};

// Entity Table
#[spacetimedb(table)]
#[derive(Clone)]
pub struct EveGlobalEntity {
    #[primarykey]
    pub entity_id: String,
    #[unique]
    pub name: String,
    pub entity_type: Option<String>,
    pub data_json: Option<String>, // JSON string for flexible data storage
    pub embedding_json: Option<String>, // Store embedding as JSON string
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
}

// Relation Table
#[spacetimedb(table)]
#[derive(Clone)]
pub struct EveGlobalRelation {
    #[primarykey]
    pub relation_id: String,
    pub source_entity_id: String,
    pub target_entity_id: String,
    pub relation_type: String,
    pub created_at: Timestamp,
}

// Knowledge Base Table
#[spacetimedb(table)]
#[derive(Clone)]
pub struct EveGlobalKnowledgeBase {
    #[primarykey]
    pub knowledge_id: String,
    pub text_content: String,
    pub embedding_json: Option<String>, // Store embedding as JSON string
    pub tags_json: Option<String>, // Store tags as JSON string
    pub source_identifier: Option<String>,
    pub created_at: Timestamp,
}

// Reducer functions for Entity
#[spacetimedb(reducer)]
pub fn create_entity(
    _ctx: ReducerContext,
    entity_id: String,
    name: String,
    entity_type: Option<String>,
    data_json: Option<String>,
    embedding_json: Option<String>,
) -> () {
    let now = Timestamp::now();
    
    let entity = EveGlobalEntity {
        entity_id,
        name,
        entity_type,
        data_json,
        embedding_json,
        created_at: now,
        updated_at: now,
    };
    
    let _ = EveGlobalEntity::insert(entity);
}

#[spacetimedb(reducer)]
pub fn update_entity(
    _ctx: ReducerContext,
    entity_id: String,
    entity_type: Option<String>,
    data_json: Option<String>,
    embedding_json: Option<String>,
) -> () {
    match EveGlobalEntity::filter_by_entity_id(&entity_id) {
        Some(entity) => {
            let mut entity_clone = entity.clone();
            
            if let Some(entity_type) = entity_type {
                entity_clone.entity_type = Some(entity_type);
            }
            
            if let Some(data_json) = data_json {
                entity_clone.data_json = Some(data_json);
            }
            
            if let Some(embedding_json) = embedding_json {
                entity_clone.embedding_json = Some(embedding_json);
            }
            
            entity_clone.updated_at = Timestamp::now();
            
            let _ = EveGlobalEntity::update_by_entity_id(&entity_id, entity_clone);
        },
        None => ()
    }
}

// Reducer functions for Relation
#[spacetimedb(reducer)]
pub fn create_relation(
    _ctx: ReducerContext,
    relation_id: String,
    source_entity_id: String,
    target_entity_id: String,
    relation_type: String,
) -> () {
    // Only create if both entities exist
    if EveGlobalEntity::filter_by_entity_id(&source_entity_id).is_none() ||
       EveGlobalEntity::filter_by_entity_id(&target_entity_id).is_none() {
        return;
    }
    
    let relation = EveGlobalRelation {
        relation_id,
        source_entity_id,
        target_entity_id,
        relation_type,
        created_at: Timestamp::now(),
    };
    
    let _ = EveGlobalRelation::insert(relation);
}

// Reducer functions for Knowledge Base
#[spacetimedb(reducer)]
pub fn create_knowledge(
    _ctx: ReducerContext,
    knowledge_id: String,
    text_content: String,
    embedding_json: Option<String>,
    tags_json: Option<String>,
    source_identifier: Option<String>,
) -> () {
    let knowledge = EveGlobalKnowledgeBase {
        knowledge_id,
        text_content,
        embedding_json,
        tags_json,
        source_identifier,
        created_at: Timestamp::now(),
    };
    
    let _ = EveGlobalKnowledgeBase::insert(knowledge);
} 