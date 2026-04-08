/**
 * Database Field Transformers
 * Converts between PascalCase (database) and camelCase (API)
 */

/**
 * Convert PascalCase object keys to camelCase and parse numeric ID fields
 */
export function toCamelCase<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item)) as any;
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const camelCased: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
        let value = obj[key];

        // Convert numeric ID fields from string to number
        if (camelKey.endsWith('ID') && typeof value === 'string' && /^\d+$/.test(value)) {
          value = parseInt(value, 10);
        }

        camelCased[camelKey] = value;
      }
    }
    return camelCased;
  }

  return obj;
}

/**
 * Transform Contact object from database to API format
 */
export function transformContact(contact: any) {
  const transformed = toCamelCase(contact);

  // Convert tags from comma-separated string to array
  if (transformed.tags && typeof transformed.tags === 'string') {
    transformed.tags = transformed.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0);
  } else if (!transformed.tags) {
    transformed.tags = [];
  }

  return transformed;
}

/**
 * Transform multiple Contacts from database to API format
 */
export function transformContacts(contacts: any[]) {
  return contacts.map(transformContact);
}
