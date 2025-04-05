use spacetimedb::{spacetimedb, ReducerContext, Identity, Timestamp, SpacetimeType, Table};
use log::info; // Make sure log is imported if not already

// --- Tables ---

#[spacetimedb(table)]
pub struct Resource {
    #[primarykey]
    #[autoinc] // Add autoinc for automatic ID generation
    id: u64,
    name: String,
    resource_type: String, // e.g., "Jira", "GitHub", "Figma"
    ingested_at: Timestamp,
    owner_id: Identity,
}

#[spacetimedb(table)]
pub struct Card {
    #[primarykey]
    #[autoinc]
    id: u64,
    title: String,
    content: String, // Or potentially a more complex type later
    created_at: Timestamp,
    owner_id: Identity,
    // TODO: Add relationships to Resources, other Cards, etc. later
}

#[spacetimedb(table)]
pub struct Output {
    #[primarykey]
    #[autoinc]
    id: u64,
    name: String,
    format: String, // e.g., "PDF", "DocX"
    created_at: Timestamp,
    source_card_id: Option<u64>, // Link back to the card it came from
    owner_id: Identity,
}


// --- Lifecycle Reducers ---

#[spacetimedb(reducer)]
pub fn init(_ctx: ReducerContext, _timestamp: Timestamp) {
    // Called once when the module is initially published
    info!("Initializing COSine Module");
}

#[spacetimedb(reducer)]
pub fn client_connected(ctx: ReducerContext, _timestamp: Timestamp, _identity: Identity) {
    // Called every time a new client connects
    info!("Client connected: {:?}", ctx.sender);
}

#[spacetimedb(reducer)]
pub fn client_disconnected(ctx: ReducerContext, _timestamp: Timestamp, _identity: Identity) {
    // Called every time a client disconnects
    info!("Client disconnected: {:?}", ctx.sender);
}

// --- COSine Reducers ---

/// Creates a new Resource associated with the calling identity.
#[spacetimedb(reducer)]
pub fn create_resource(ctx: ReducerContext, timestamp: Timestamp, name: String, resource_type: String) -> Result<(), String> {
    info!("Reducer: create_resource called by {:?} with name: {}, type: {}", ctx.sender, name, resource_type);
    Resource::insert(Resource {
        id: 0, // ID is auto-generated because of #[autoinc]
        name,
        resource_type,
        ingested_at: timestamp,
        owner_id: ctx.sender,
    })?;
    Ok(())
}

/// Example reducer - kept for reference, consider removing in final template
#[spacetimedb(reducer)]
pub fn create_dummy_resource(ctx: ReducerContext, timestamp: Timestamp, name: String, resource_type: String) -> Result<(), String> {
    info!("Creating dummy resource: {} ({})", name, resource_type);
    Resource::insert(Resource {
        id: 0, // ID is auto-generated
        name,
        resource_type,
        ingested_at: timestamp,
        owner_id: ctx.sender,
    })?;
    Ok(())
}

// Note: Read operations typically don't need reducers.
// Clients subscribe to tables (e.g., `SELECT * FROM Resource`)
// and SpacetimeDB pushes updates automatically.
