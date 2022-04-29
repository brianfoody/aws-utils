// import { makeCognitoAuthoriser } from "../src/adapters/cognitoFederatedAuthoriser";
// import { makeCognitoAuthenticator } from "../src/adapters/cognitoUserPoolAuthenticator";
// import { makeCognitoAuthManager } from "../src/adapters/cognitoAuthManager";
// import {
//   AWS_ACCOUNT_ID,
//   AWS_IDENTITY_POOL_ID,
//   AWS_REGION,
//   AWS_USER_POOL_ID,
//   AWS_USER_POOL_WEB_CLIENT_ID,
//   testLocalStorer,
// } from "./testUtils";

// const exec = async () => {
//   const authenticator = makeCognitoAuthenticator({
//     config: {
//       region: AWS_REGION!,
//       userPoolId: AWS_USER_POOL_ID!,
//       clientId: AWS_USER_POOL_WEB_CLIENT_ID!,
//     },
//     localStorage: testLocalStorer(),
//   });

//   const authoriser = makeCognitoAuthoriser({
//     config: {
//       region: AWS_REGION!,
//       identityPoolId: AWS_IDENTITY_POOL_ID!,
//       accountId: AWS_ACCOUNT_ID!,
//     },
//     authenticationProvider: authenticator,
//   });

//   await authenticator.signIn({
//     username: "088d6a9",
//     password:
//       "088d6a9f6fab9bba2f7661e2f4bfcc73cfdf7542a777ce6581c011d14079993d",
//   });

//   const authManager = makeCognitoAuthManager({
//     authenticator,
//     authoriser,
//     localStorage: testLocalStorer(),
//     config: {
//       region: AWS_REGION!,
//       clientId: AWS_USER_POOL_WEB_CLIENT_ID!,
//     },
//   });

//   await authManager.setMfaSigninAccess();
// };

// exec();
