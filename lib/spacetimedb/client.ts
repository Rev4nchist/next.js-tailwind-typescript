import { getSpacetimeDBConnection } from '@/utils/spacetimedb';

// In future, additional setup or utility methods can be added here.
// For now, we just re-export the existing connection helper
// to establish this file as the entry point for client logic.
export const spacetimeDbConnection = getSpacetimeDBConnection; 