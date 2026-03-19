import { queryItems, getItem, putItem, deleteItem, updateItem } from '../shared/db.mjs';
import { ok, error } from '../shared/response.mjs';
import { getTrainerId } from '../shared/auth.mjs';

const TABLE = process.env.TABLE_NAME || 'forge-pt-nutrition';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return ok({});

  const trainerId = getTrainerId(event);
  const method = event.httpMethod;
  const pathParams = event.pathParameters || {};
  const queryParams = event.queryStringParameters || {};
  const body = event.body ? JSON.parse(event.body) : {};

  const clientId = pathParams.clientId || queryParams.clientId;

  try {
    if (method === 'GET' && clientId && !pathParams.date) {
      // List all nutrition records for a client
      const items = await queryItems(TABLE, 'clientId = :cid', { ':cid': clientId });
      const filtered = items.filter(item => item.trainerId === trainerId);
      return ok(filtered);
    }

    if (method === 'GET' && clientId && pathParams.date) {
      const item = await getItem(TABLE, { clientId, date: pathParams.date });
      if (!item || item.trainerId !== trainerId) return error(404, 'Not found');
      return ok(item);
    }

    if (method === 'POST' && clientId) {
      const date = body.date || new Date().toISOString().split('T')[0];
      const item = {
        clientId,
        date,
        trainerId,
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await putItem(TABLE, item);
      return ok(item);
    }

    if (method === 'PUT' && clientId && pathParams.date) {
      const existing = await getItem(TABLE, { clientId, date: pathParams.date });
      if (!existing || existing.trainerId !== trainerId) return error(403, 'Forbidden');
      await updateItem(TABLE, { clientId, date: pathParams.date }, {
        ...body,
        updatedAt: new Date().toISOString(),
      });
      return ok({ success: true });
    }

    if (method === 'DELETE' && clientId && pathParams.date) {
      const existing = await getItem(TABLE, { clientId, date: pathParams.date });
      if (!existing || existing.trainerId !== trainerId) return error(403, 'Forbidden');
      await deleteItem(TABLE, { clientId, date: pathParams.date });
      return ok({ success: true });
    }

    return error(400, 'Invalid request — clientId is required');
  } catch (err) {
    console.error(err);
    return error(500, err.message);
  }
}
