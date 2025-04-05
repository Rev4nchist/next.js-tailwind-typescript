// lib/spacetimedb/subscriptions.ts
export function subscribeToExample(callback: (data: any) => void) {
  // In future: spacetimeClient.subscribe('table_or_channel', callback);
  console.warn('subscribeToExample is not implemented yet.');
  return () => {}; // return unsubscribe function
} 