/**
 * Utility functions for tenant identification and management
 * 
 * Currently using hardcoded UUIDs, but will be expanded to lookup tenants
 * based on API keys in a Redis database in the future.
 */

/**
 * Get tenant and host IDs from API key
 * @param apiKey The API key to lookup
 * @returns An object containing the tenant_id and host_id associated with the API key
 */
export const getTenantFromApiKey = (_apiKey: string): { tenant_id: string; host_id: string } => {
  // For now, we're hardcoding the tenant_id and host_id as UUIDs
  // TODO: In the future, this will lookup these values in a Redis database
  return {
    tenant_id: '550e8400-e29b-41d4-a716-446655440000', // Hardcoded UUID for tenant
    host_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'    // Hardcoded UUID for host
  };
};

/**
 * Validate if an API key is valid
 * @param apiKey The API key to validate
 * @returns Whether the API key is valid
 */
export const validateApiKey = (apiKey: string): boolean => {
  // For now, we're just checking against the expected API key from environment
  const expectedApiKey = process.env.API_KEY || 'testkey';
  return apiKey === expectedApiKey;
};
