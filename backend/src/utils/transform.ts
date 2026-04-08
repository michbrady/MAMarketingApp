/**
 * Database Field Transformers
 * Converts between PascalCase (database) and camelCase (API)
 */

/**
 * Convert PascalCase object keys to camelCase
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
        camelCased[camelKey] = obj[key];
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
  return toCamelCase(contact);
}

/**
 * Transform multiple Contacts from database to API format
 */
export function transformContacts(contacts: any[]) {
  return contacts.map(transformContact);
}
