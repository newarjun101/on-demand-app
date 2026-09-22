// Postman collection generator. Reads the OpenAPI spec built by swagger.ts
// and writes backend/postman-collection.json — a v2.1 Postman collection
// that can be imported into Postman, Insomnia, or VS Code REST Client.
//
// Usage: cd backend && node dist/scripts/postman.js [locale=en]
//   or: npx tsx src/scripts/postman.ts [locale=en]
//
// The locale argument picks the version of the spec to base the collection
// on (default 'en'). We bake a baseUrl with the locale placeholder so the
// collection works regardless of which language the user prefers.

import { buildSpec } from '../swagger';
import * as fs from 'fs';
import * as path from 'path';

const locale = (process.argv[2] as 'en' | 'zh' | 'my' | 'th' | 'hi') || 'en';
const spec: any = buildSpec(locale);

interface PostmanItem {
  name: string;
  item?: PostmanItem[];
  request?: {
    method: string;
    header: Array<{ key: string; value: string; type?: string }>;
    url: { raw: string; host: string[]; path: string[]; query?: Array<{ key: string; value: string }> };
    body?: { mode: string; raw: string; options: { raw: { language: string } } };
    description?: string;
  };
  response?: any[];
}

const TAG_TO_FOLDER: Record<string, string> = {
  Auth: 'Auth',
  Users: 'Users & Profile',
  Workers: 'Workers',
  Services: 'Services & Categories',
  Requests: 'Service Requests',
  Quotes: 'Quotes',
  Bookings: 'Bookings',
  Chat: 'Chat & Messages',
  Favorites: 'Favorites',
  Notifications: 'Notifications',
  Reviews: 'Reviews',
  Files: 'File Uploads',
  Boost: 'Profile Boost',
  Analytics: 'Worker Analytics',
  Events: 'Event Tracking',
  Disputes: 'Disputes',
  Health: 'Health',
};

function expandOpenApiPath(openApiPath: string): { host: string; path: string[]; vars: Array<{ key: string; value: string }> } {
  // /api/v1/{locale}/auth/login  →  host: localhost:4000, path: ['api','v1','{{locale}}','auth','login']
  const trimmed = openApiPath.replace(/^\//, '');
  const parts = trimmed.split('/');
  const host = '{{baseUrl}}';
  return { host, path: parts, vars: [] };
}

function bodyFromSchemaName(_name: string, method: string): string {
  // A minimal example body. Postman lets you edit before sending.
  return method === 'POST' || method === 'PUT' || method === 'PATCH'
    ? '{\n  "example": "value"\n}'
    : '';
}

function itemsFromSpec(): PostmanItem[] {
  const folders = new Map<string, PostmanItem[]>();

  for (const [opPath, ops] of Object.entries(spec.paths ?? {})) {
    for (const [method, op] of Object.entries<any>(ops ?? {})) {
      const tagName = op.tags?.[0] ?? 'Misc';
      const folderName = TAG_TO_FOLDER[tagName] ?? tagName;
      if (!folders.has(folderName)) folders.set(folderName, []);

      const { host, path: pathParts, vars } = expandOpenApiPath(opPath);
      const rawUrl = '{{baseUrl}}/' + pathParts.join('/');

      // collect path params
      const pathParams = (op.parameters ?? []).filter((p: any) => p.in === 'path');
      const queryParams = (op.parameters ?? []).filter((p: any) => p.in === 'query');
      const queryString = queryParams.length
        ? (rawUrl.includes('?') ? '&' : '?') + queryParams.map((q: any) => `${q.name}=${q.schema?.type === 'number' ? '0' : ''}`).join('&')
        : '';
      const url = {
        raw: rawUrl + queryString,
        host: [host],
        path: pathParts,
        query: queryParams.map((q: any) => ({ key: q.name, value: '' })),
      };

      const item: PostmanItem = {
        name: op.summary ?? `${method.toUpperCase()} ${opPath}`,
        request: {
          method: method.toUpperCase(),
          header: [
            { key: 'Accept-Language', value: locale, type: 'text' },
            ...(op.security ? [{ key: 'Authorization', value: 'Bearer {{token}}', type: 'text' as const }] : []),
          ],
          url,
          description: op.description ?? '',
          ...(op.requestBody ? { body: { mode: 'raw', raw: bodyFromSchemaName(op.requestBody?.content?.['application/json']?.schema?.$ref, method), options: { raw: { language: 'json' } } } } : {}),
        },
      };
      folders.get(folderName)!.push(item);
    }
  }

  return Array.from(folders.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, items]) => ({
      name,
      item: items.sort((a, b) => a.name.localeCompare(b.name)),
    }));
}

const collection = {
  info: {
    _postman_id: 'lsm-postman-' + Date.now(),
    name: 'Local Services Marketplace',
    description: 'Auto-generated Postman collection from the OpenAPI 3.0 spec. See ' +
      'http://localhost:4000/api/docs (Swagger UI) or the OpenAPI JSON at ' +
      'http://localhost:4000/api/docs.json for the live spec.\n\n' +
      'Two baseUrl variables are pre-set: `{{baseUrl}}` (default http://localhost:4000) ' +
      'and `{{locale}}` (default "en"). Use the versioned prefix `/api/v1/{{locale}}` ' +
      'or the legacy `/api` — both work. After login, set `{{token}}` from the accessToken.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:4000' },
    { key: 'locale',  value: locale },
    { key: 'token',   value: '' },
  ],
  item: itemsFromSpec(),
  auth: {
    type: 'bearer',
    bearer: [{ key: 'token', value: '{{token}}', type: 'string' }],
  },
};

const outPath = path.resolve(__dirname, '../../postman-collection.json');
fs.writeFileSync(outPath, JSON.stringify(collection, null, 2));
console.log('Wrote', outPath);
console.log('Folders:', collection.item.length, 'Items:', collection.item.reduce((n, f) => n + (f.item?.length ?? 0), 0));
