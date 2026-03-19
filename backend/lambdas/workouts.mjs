import { queryItems, getItem, putItem, deleteItem, updateItem } from './shared/db.mjs';
import { ok, error } from './shared/response.mjs';
import { parseEvent } from './shared/auth.mjs';

const TABLE = process.env.TABLE_NAME || 'forge-pt-workouts';

export async function handler(event) {
  if (method === 'OPTIONS') return ok({});

  const { method, id, body, trainerId } = parseEvent(event);
  
  
  

  try {
    if (method === 'GET' && !id) {
      const items = await queryItems(TABLE, 'trainerId = :tid', { ':tid': trainerId });
      return ok(items);
    }

    if (method === 'GET' && id) {
      const item = await getItem(TABLE, { trainerId, workoutId: id });
      return item ? ok(item) : error(404, 'Not found');
    }

    if (method === 'POST') {
      const item = {
        trainerId,
        workoutId: `WKT-${Date.now()}`,
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await putItem(TABLE, item);
      return ok(item);
    }

    if (method === 'PUT' && id) {
      await updateItem(TABLE, { trainerId, workoutId: id }, {
        ...body,
        updatedAt: new Date().toISOString(),
      });
      return ok({ success: true });
    }

    if (method === 'DELETE' && id) {
      await deleteItem(TABLE, { trainerId, workoutId: id });
      return ok({ success: true });
    }

    return error(400, 'Invalid request');
  } catch (err) {
    console.error(err);
    return error(500, err.message);
  }
}
