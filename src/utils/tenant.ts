/**
 * Utility functions for tenant identification and management
 * 
 * Currently using a hardcoded value, but will be expanded to lookup tenants
 * based on API keys in a database in the future.
 */

/**
 * Get tenant ID from API key
 * @param apiKey The API key to lookup
 * @returns The tenant ID associated with the API key
 */
export const getTenantIdFromApiKey = (apiKey: string): string => {
  // For now, we're hardcoding the tenant ID
  // TODO: In the future, this will lookup the tenant ID in a database
  return 'test_tenant';
};

/**
 * Validate if an API key is valid for a given tenant
 * @param apiKey The API key to validate
 * @param tenantId The tenant ID to validate against
 * @returns Whether the API key is valid for the tenant
 */
export const validateApiKeyForTenant = (apiKey: string, tenantId: string): boolean => {
  // For now, we're just checking against the expected API key from environment
  const expectedApiKey = process.env.API_KEY || 'testkey';
  return apiKey === expectedApiKey;
};
