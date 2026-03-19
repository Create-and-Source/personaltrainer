export function getTrainerId(event) {
  // From Cognito authorizer
  const claims = event.requestContext?.authorizer?.claims;
  if (claims) return claims.sub || claims.email;
  // Fallback: header
  return event.headers?.['x-trainer-id'] || 'demo-trainer';
}
