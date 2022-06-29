const { typescript } = require("projen");

const project = new typescript.TypeScriptProject({
  defaultReleaseBranch: "main",
  name: "brianfoody-aws-utils-v2",
  releaseToNpm: true,
  majorVersion: 1,
  tsconfig: {
    compilerOptions: {
      strictPropertyInitialization: false,
      lib: ["es2019", "dom"],
    },
  },
  eslintOptions: {
    prettier: true,
  },
  prettierOptions: {},
  jestOptions: {
    jestConfig: {},
  },
  scripts: {
    integration: "npx jest -c jest.integration.js --runInBand",
  },
  devDeps: ["@types/aws-lambda", "@types/crypto-js", "cross-fetch"],
  deps: [
    "@aws-sdk/credential-provider-cognito-identity",
    "@aws-sdk/credential-providers",
    "@aws-sdk/client-cognito-identity-provider",
    "@aws-sdk/client-dynamodb",
    "@aws-sdk/client-s3",
    "@aws-sdk/lib-dynamodb",
    "@aws-sdk/util-dynamodb",
    "@aws-sdk/types",
    "@aws-sdk/s3-request-presigner",
    "aws-lambda",
    "aws-sdk",
    "crypto-js",
    "jwt-decode",
    "ts-retry-promise",
  ],
});

project.synth();
