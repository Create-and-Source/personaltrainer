import { queryItems, getItem, putItem, deleteItem } from './shared/db.mjs';
import { ok, error } from './shared/response.mjs';
import { getTrainerId } from './shared/auth.mjs';

const TABLE = process.env.TABLE_NAME || 'forge-pt-messages';

export async function handler(event) {
  if (event.requestContext?.http?.method || event.httpMethod === 'OPTIONS') return ok({});

  const trainerId = getTrainerId(event);
  const method = event.requestContext?.http?.method || event.httpMethod;
  const pathParams = event.pathParameters || {};
  const queryParams = event.queryStringParameters || {};
  const body = event.body ? JSON.parse(event.body) : {};

  const conversationId = pathParams.conversationId || queryParams.conversationId;

  try {
    if (method === 'GET' && conversationId) {
      // List all messages in a conversation
      const items = await queryItems(TABLE, 'conversationId = :cid', { ':cid': conversationId });
      return ok(items);
    }

    if (method === 'GET' && !conversationId) {
      // List conversations for this trainer (by GSI on trainerId)
      const items = await queryItems(TABLE, 'trainerId = :tid', { ':tid': trainerId }, 'trainerId-index');
      // Deduplicate by conversationId to get conversation list
      const convMap = {};
      items.forEach(msg => {
        if (!convMap[msg.conversationId] || msg.timestamp > convMap[msg.conversationId].timestamp) {
          convMap[msg.conversationId] = msg;
        }
      });
      return ok(Object.values(convMap));
    }

    if (method === 'POST') {
      const convId = conversationId || body.conversationId || `CONV-${trainerId}-${body.clientId || Date.now()}`;
      const item = {
        conversationId: convId,
        timestamp: new Date().toISOString(),
        trainerId,
        ...body,
        createdAt: new Date().toISOString(),
      };
      await putItem(TABLE, item);
      return ok(item);
    }

    if (method === 'DELETE' && conversationId && pathParams.timestamp) {
      await deleteItem(TABLE, { conversationId, timestamp: pathParams.timestamp });
      return ok({ success: true });
    }

    return error(400, 'Invalid request');
  } catch (err) {
    console.error(err);
    return error(500, err.message);
  }
}
