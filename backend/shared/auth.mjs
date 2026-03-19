export function getTrainerId(event) {
  // From Cognito authorizer
  const claims = event.requestContext?.authorizer?.claims;
  if (claims) return claims.sub || claims.email;
  // Fallback: header
  return event.headers?.['x-trainer-id'] || 'demo-trainer';
}

// Normalize API Gateway v2 event to standard format
export function parseEvent(event) {
  const method = event.requestContext?.http?.method || event.httpMethod || 'GET';
  const path = event.requestContext?.http?.path || event.path || '';
  const pathParts = path.split('/').filter(Boolean);
  // /api/clients/{id} → id is the last segment if path has 3+ parts
  const id = event.pathParameters?.id || (pathParts.length >= 3 ? pathParts[pathParts.length - 1] : null);
  const body = event.body ? (typeof event.body === 'string' ? JSON.parse(event.body) : event.body) : {};
  const trainerId = getTrainerId(event);

  return { method, id, body, trainerId, path };
}
