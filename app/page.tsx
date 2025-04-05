"use client"

import { useEffect, useState } from "react";
import { ensureSpacetimeDBConnection, getSpacetimeDBConnection } from "@/utils/spacetimedb";
import { Resource } from "@/src/spacetimedb"; // Import generated Resource type
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function Home() {
  const [connectionAttempted, setConnectionAttempted] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [newResourceName, setNewResourceName] = useState("");
  const [newResourceType, setNewResourceType] = useState("");

  // Ensure connection is initiated on component mount
  useEffect(() => {
    if (!connectionAttempted) {
      ensureSpacetimeDBConnection(); // Attempt connection
      setConnectionAttempted(true);

      // Set up subscription after connection is likely established
      // A more robust approach might use the onConnect callback in utils/spacetimedb.ts
      const conn = getSpacetimeDBConnection();
      if (conn) {
        const registerSubs = () => {
            console.log("Registering Resource subscription...");
            // Clear local cache and subscribe to all resources
            Resource.clear();
            conn.subscribe("SELECT * FROM Resource");

            // Register listeners for insert/update/delete
            Resource.onInsert((resource: Resource) => {
                console.log("Resource inserted:", resource);
                setResources(prev => [...prev, resource]);
            });
             Resource.onUpdate((_oldValue: Resource, newValue: Resource) => {
                console.log("Resource updated:", newValue);
                setResources(prev => prev.map(r => r.id === newValue.id ? newValue : r));
            });
            Resource.onDelete((deletedValue: Resource) => {
                console.log("Resource deleted:", deletedValue);
                setResources(prev => prev.filter(r => r.id !== deletedValue.id));
            });
            // Initial load (after clearing)
            setResources(Resource.getAll());
        }

        // If already connected, register immediately. Otherwise, wait for onConnect.
        if (conn.status() === "connected") {
            registerSubs();
        } else {
            conn.onceOnConnect(registerSubs);
        }
      }
    }
  }, [connectionAttempted]);

  const handleCreateResource = () => {
    const conn = getSpacetimeDBConnection();
    if (conn && newResourceName && newResourceType) {
      console.log(`Calling create_resource reducer with: ${newResourceName}, ${newResourceType}`);
      // Call the reducer defined in Rust
      conn.call("create_resource", newResourceName, newResourceType);
      setNewResourceName("");
      setNewResourceType("");
    } else {
      console.error("Connection not established or missing input.");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 space-y-8">
      <h1 className="text-4xl font-bold">COSine SpacetimeDB Template</h1>

      <Card className="w-full max-w-md">
          <CardHeader>
              <CardTitle>Create Resource</CardTitle>
              <CardDescription>Add a new resource via SpacetimeDB reducer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
               <div className="space-y-1">
                  <Label htmlFor="res-name">Resource Name</Label>
                  <Input
                      id="res-name"
                      value={newResourceName}
                      onChange={(e) => setNewResourceName(e.target.value)}
                      placeholder="e.g., Jira Project X"
                  />
               </div>
                <div className="space-y-1">
                  <Label htmlFor="res-type">Resource Type</Label>
                  <Input
                      id="res-type"
                      value={newResourceType}
                      onChange={(e) => setNewResourceType(e.target.value)}
                      placeholder="e.g., Jira"
                  />
               </div>
          </CardContent>
           <CardFooter>
               <Button onClick={handleCreateResource} disabled={!newResourceName || !newResourceType}>
                    Create Resource
                </Button>
           </CardFooter>
      </Card>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Resources</CardTitle>
           <CardDescription>List of resources from SpacetimeDB.</CardDescription>
        </CardHeader>
        <CardContent>
          {resources.length === 0 ? (
            <p>No resources found. Ensure SpacetimeDB is running and connected.</p>
          ) : (
            <ul className="space-y-2">
              {resources.map((res) => (
                <li key={res.id} className="border p-2 rounded">
                  ID: {res.id} <br />
                  Name: {res.name} <br />
                  Type: {res.resource_type} <br />
                  Owner: {res.owner_id.toHexString().substring(0, 8)}... <br/>
                  Ingested: {new Date(Number(res.ingested_at) / 1000000).toLocaleString()} {/* Convert ns to ms */}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
