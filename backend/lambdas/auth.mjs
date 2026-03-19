import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand } from '@aws-sdk/client-cognito-identity-provider';

const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-west-2' });

export async function handler(event) {
  console.log('Post-confirmation trigger:', JSON.stringify(event));

  const userPoolId = event.userPoolId;
  const username = event.userName;
  const email = event.request.userAttributes.email;
  const role = event.request.userAttributes['custom:role'] || 'trainer';

  try {
    // Add user to the appropriate Cognito group based on role
    const groupName = role === 'client' ? 'clients' : 'trainers';

    await cognito.send(new AdminAddUserToGroupCommand({
      UserPoolId: userPoolId,
      Username: username,
      GroupName: groupName,
    }));

    console.log(`Added user ${email} (${username}) to group: ${groupName}`);
  } catch (err) {
    // Don't fail the confirmation if group assignment fails
    console.error('Error adding user to group:', err);
  }

  // Must return the event object for Cognito triggers
  return event;
}
