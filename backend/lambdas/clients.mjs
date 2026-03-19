import { queryItems, getItem, putItem, deleteItem, updateItem } from './shared/db.mjs';
import { ok, error } from './shared/response.mjs';
import { parseEvent } from './shared/auth.mjs';

const TABLE = process.env.TABLE_NAME || 'forge-pt-clients';

export async function handler(event) {
  const { method, id, body, trainerId } = parseEvent(event);
  if (method === 'OPTIONS') return ok({});

  try {
    if (method === 'GET' && !id) {
      const items = await queryItems(TABLE, 'trainerId = :tid', { ':tid': trainerId });
      return ok(items);
    }

    if (method === 'GET' && id) {
      const item = await getItem(TABLE, { trainerId, clientId: id });
      return item ? ok(item) : error(404, 'Not found');
    }

    if (method === 'POST') {
      const item = {
        trainerId,
        clientId: `CLT-${Date.now()}`,
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await putItem(TABLE, item);
      return ok(item);
    }

    if (method === 'PUT' && id) {
      await updateItem(TABLE, { trainerId, clientId: id }, {
        ...body,
        updatedAt: new Date().toISOString(),
      });
      return ok({ success: true });
    }

    if (method === 'DELETE' && id) {
      await deleteItem(TABLE, { trainerId, clientId: id });
      return ok({ success: true });
    }

    return error(400, 'Invalid request');
  } catch (err) {
    console.error(err);
    return error(500, err.message);
  }
}
