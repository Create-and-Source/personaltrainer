import { queryItems, getItem, putItem, deleteItem, updateItem } from '../shared/db.mjs';
import { ok, error } from '../shared/response.mjs';
import { getTrainerId } from '../shared/auth.mjs';

const TABLE = process.env.TABLE_NAME || 'forge-pt-habits';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return ok({});

  const trainerId = getTrainerId(event);
  const method = event.httpMethod;
  const pathParams = event.pathParameters || {};
  const queryParams = event.queryStringParameters || {};
  const body = event.body ? JSON.parse(event.body) : {};

  const clientId = pathParams.clientId || queryParams.clientId;

  try {
    if (method === 'GET' && clientId && !pathParams.habitDate) {
      // List all habit records for a client
      const items = await queryItems(TABLE, 'clientId = :cid', { ':cid': clientId });
      const filtered = items.filter(item => item.trainerId === trainerId);
      return ok(filtered);
    }

    if (method === 'GET' && clientId && pathParams.habitDate) {
      const item = await getItem(TABLE, { clientId, habitDate: pathParams.habitDate });
      if (!item || item.trainerId !== trainerId) return error(404, 'Not found');
      return ok(item);
    }

    if (method === 'POST' && clientId) {
      const habitDate = body.habitDate || new Date().toISOString().split('T')[0];
      const item = {
        clientId,
        habitDate,
        trainerId,
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await putItem(TABLE, item);
      return ok(item);
    }

    if (method === 'PUT' && clientId && pathParams.habitDate) {
      const existing = await getItem(TABLE, { clientId, habitDate: pathParams.habitDate });
      if (!existing || existing.trainerId !== trainerId) return error(403, 'Forbidden');
      await updateItem(TABLE, { clientId, habitDate: pathParams.habitDate }, {
        ...body,
        updatedAt: new Date().toISOString(),
      });
      return ok({ success: true });
    }

    if (method === 'DELETE' && clientId && pathParams.habitDate) {
      const existing = await getItem(TABLE, { clientId, habitDate: pathParams.habitDate });
      if (!existing || existing.trainerId !== trainerId) return error(403, 'Forbidden');
      await deleteItem(TABLE, { clientId, habitDate: pathParams.habitDate });
      return ok({ success: true });
    }

    return error(400, 'Invalid request — clientId is required');
  } catch (err) {
    console.error(err);
    return error(500, err.message);
  }
}
