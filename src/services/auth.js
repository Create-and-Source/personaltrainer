import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';

const POOL_DATA = {
  UserPoolId: 'us-west-2_TvS6pEeA1',
  ClientId: '4sci30mkp1e62rg2rg54f51e13',
};

const userPool = new CognitoUserPool(POOL_DATA);

export function getCurrentUser() {
  return userPool.getCurrentUser();
}

export function getSession() {
  return new Promise((resolve, reject) => {
    const user = getCurrentUser();
    if (!user) return resolve(null);
    user.getSession((err, session) => {
      if (err) return reject(err);
      resolve(session);
    });
  });
}

export function getToken() {
  return getSession().then(session => session?.getIdToken()?.getJwtToken() || null);
}

export function signIn(email, password) {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    const authDetails = new AuthenticationDetails({ Username: email, Password: password });

    user.authenticateUser(authDetails, {
      onSuccess: (result) => resolve({ success: true, token: result.getIdToken().getJwtToken(), user: result }),
      onFailure: (err) => reject(err),
      newPasswordRequired: (userAttributes) => {
        // First login — need to set permanent password
        resolve({ success: false, newPasswordRequired: true, user, userAttributes });
      },
    });
  });
}

export function completeNewPassword(cognitoUser, newPassword) {
  return new Promise((resolve, reject) => {
    cognitoUser.completeNewPasswordChallenge(newPassword, {}, {
      onSuccess: (result) => resolve({ success: true, token: result.getIdToken().getJwtToken() }),
      onFailure: (err) => reject(err),
    });
  });
}

export function signOut() {
  const user = getCurrentUser();
  if (user) user.signOut();
}

export function isLoggedIn() {
  return !!getCurrentUser();
}
