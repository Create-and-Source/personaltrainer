import { queryItems, getItem, putItem, deleteItem, updateItem } from '../shared/db.mjs';
import { ok, error } from '../shared/response.mjs';
import { getTrainerId } from '../shared/auth.mjs';

const TABLE = process.env.TABLE_NAME || 'forge-pt-memberships';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return ok({});

  const trainerId = getTrainerId(event);
  const method = event.httpMethod;
  const pathParams = event.pathParameters || {};
  const body = event.body ? JSON.parse(event.body) : {};

  try {
    if (method === 'GET' && !pathParams.id) {
      const items = await queryItems(TABLE, 'trainerId = :tid', { ':tid': trainerId });
      return ok(items);
    }

    if (method === 'GET' && pathParams.id) {
      const item = await getItem(TABLE, { trainerId, membershipId: pathParams.id });
      return item ? ok(item) : error(404, 'Not found');
    }

    if (method === 'POST') {
      const item = {
        trainerId,
        membershipId: `MEM-${Date.now()}`,
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await putItem(TABLE, item);
      return ok(item);
    }

    if (method === 'PUT' && pathParams.id) {
      await updateItem(TABLE, { trainerId, membershipId: pathParams.id }, {
        ...body,
        updatedAt: new Date().toISOString(),
      });
      return ok({ success: true });
    }

    if (method === 'DELETE' && pathParams.id) {
      await deleteItem(TABLE, { trainerId, membershipId: pathParams.id });
      return ok({ success: true });
    }

    return error(400, 'Invalid request');
  } catch (err) {
    console.error(err);
    return error(500, err.message);
  }
}
