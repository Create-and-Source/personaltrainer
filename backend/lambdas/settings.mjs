import { getItem, putItem, updateItem } from '../shared/db.mjs';
import { ok, error } from '../shared/response.mjs';
import { getTrainerId } from '../shared/auth.mjs';

const TABLE = process.env.TABLE_NAME || 'forge-pt-settings';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return ok({});

  const trainerId = getTrainerId(event);
  const method = event.httpMethod;
  const body = event.body ? JSON.parse(event.body) : {};

  try {
    if (method === 'GET') {
      // Get settings for this trainer (single item, no range key)
      const item = await getItem(TABLE, { trainerId });
      if (!item) {
        // Return defaults if no settings exist yet
        return ok({
          trainerId,
          businessName: '',
          timezone: 'America/Phoenix',
          sessionDuration: 60,
          currency: 'USD',
          notifications: { email: true, sms: false },
        });
      }
      return ok(item);
    }

    if (method === 'POST' || method === 'PUT') {
      // Upsert settings — single item per trainer
      const existing = await getItem(TABLE, { trainerId });
      if (existing) {
        await updateItem(TABLE, { trainerId }, {
          ...body,
          updatedAt: new Date().toISOString(),
        });
      } else {
        const item = {
          trainerId,
          ...body,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await putItem(TABLE, item);
      }
      return ok({ success: true });
    }

    return error(400, 'Invalid request');
  } catch (err) {
    console.error(err);
    return error(500, err.message);
  }
}
