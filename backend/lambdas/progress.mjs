import { queryItems, getItem, putItem, deleteItem, updateItem } from '../shared/db.mjs';
import { ok, error } from '../shared/response.mjs';
import { getTrainerId } from '../shared/auth.mjs';

const TABLE = process.env.TABLE_NAME || 'forge-pt-progress';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return ok({});

  const trainerId = getTrainerId(event);
  const method = event.httpMethod;
  const pathParams = event.pathParameters || {};
  const queryParams = event.queryStringParameters || {};
  const body = event.body ? JSON.parse(event.body) : {};

  // Progress records are keyed by clientId, so we need clientId from path or query
  const clientId = pathParams.clientId || queryParams.clientId;

  try {
    if (method === 'GET' && clientId && !pathParams.id) {
      // List all progress records for a client
      const items = await queryItems(TABLE, 'clientId = :cid', { ':cid': clientId });
      // Filter to only records belonging to this trainer
      const filtered = items.filter(item => item.trainerId === trainerId);
      return ok(filtered);
    }

    if (method === 'GET' && clientId && pathParams.id) {
      const item = await getItem(TABLE, { clientId, recordId: pathParams.id });
      if (!item || item.trainerId !== trainerId) return error(404, 'Not found');
      return ok(item);
    }

    if (method === 'POST' && clientId) {
      const item = {
        clientId,
        recordId: `PRG-${Date.now()}`,
        trainerId,
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await putItem(TABLE, item);
      return ok(item);
    }

    if (method === 'PUT' && clientId && pathParams.id) {
      // Verify ownership before update
      const existing = await getItem(TABLE, { clientId, recordId: pathParams.id });
      if (!existing || existing.trainerId !== trainerId) return error(403, 'Forbidden');
      await updateItem(TABLE, { clientId, recordId: pathParams.id }, {
        ...body,
        updatedAt: new Date().toISOString(),
      });
      return ok({ success: true });
    }

    if (method === 'DELETE' && clientId && pathParams.id) {
      const existing = await getItem(TABLE, { clientId, recordId: pathParams.id });
      if (!existing || existing.trainerId !== trainerId) return error(403, 'Forbidden');
      await deleteItem(TABLE, { clientId, recordId: pathParams.id });
      return ok({ success: true });
    }

    return error(400, 'Invalid request — clientId is required');
  } catch (err) {
    console.error(err);
    return error(500, err.message);
  }
}
