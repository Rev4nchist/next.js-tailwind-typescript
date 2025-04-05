import { DbConnection, Identity } from "../src/spacetimedb"; // Adjusted import path

// Ensure environment variables are defined
const spacetimeDbUri = process.env.NEXT_PUBLIC_SPACETIMEDB_URI;
const spacetimeDbName = process.env.SPACETIMEDB_DB_NAME;

if (!spacetimeDbUri) {
  throw new Error("Missing NEXT_PUBLIC_SPACETIMEDB_URI environment variable");
}
if (!spacetimeDbName) {
    throw new Error("Missing SPACETIMEDB_DB_NAME environment variable");
}

let connection: DbConnection | null = null;

// Function to get the singleton connection instance
export const getSpacetimeDBConnection = () => {
  if (!connection) {
    console.log(`Attempting connection to SpacetimeDB at ${spacetimeDbUri}, DB: ${spacetimeDbName}`);

    // Retrieve token from local storage if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('spacetimedb_auth_token') : undefined;

    connection = DbConnection.builder()
      .withUri(spacetimeDbUri)
      .withModuleName(spacetimeDbName)
      .withToken(token || undefined) // Pass undefined if no token
      .onConnect((conn: DbConnection, identity: Identity, obtainedToken?: string) => {
        console.log(
          "Connected to SpacetimeDB with identity:",
          identity.toHexString()
        );
        // Store the token (obtained on first connection or refresh)
        if (obtainedToken && typeof window !== 'undefined') {
            localStorage.setItem('spacetimedb_auth_token', obtainedToken);
        }
        // TODO: Register table subscriptions here using 'conn'
        // Example: conn.db.Resource.subscribe(); // Assuming Resource table exists
      })
      .onDisconnect(() => {
        console.warn("Disconnected from SpacetimeDB.");
        // Consider more robust reconnect logic if needed
        // For a template, simple logging might suffice.
        connection = null; // Clear instance on disconnect
      })
      .onConnectError((_conn: DbConnection | undefined, err: Error) => {
        console.error("Error connecting to SpacetimeDB:", err);
        connection = null; // Clear instance on error
      })
      .build();
  }
  return connection;
};

// Helper to ensure connection is initiated (e.g., in _app.tsx or layout)
export const ensureSpacetimeDBConnection = () => {
    getSpacetimeDBConnection();
};

// Optional: A hook for easy access in React components
// import { useState, useEffect } from 'react';
// export const useSpacetimeDB = () => {
//   const [dbClient, setDbClient] = useState<SpacetimeDBClient | null>(null);
//
//   useEffect(() => {
//     const instance = getSpacetimeDBClient();
//     setDbClient(instance);
//
//     // Optional cleanup if needed, though client is singleton
//     // return () => { /* cleanup */ };
//   }, []);
//
//   return dbClient;
// }; 