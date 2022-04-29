import { SecretsManager } from "aws-sdk";

export const expectSecrets = async <T extends string>(
  ...secretIds: T[]
): Promise<{ [P in T]: string }> => {
  try {
    const secretsManager = new SecretsManager();
    const secrets = await Promise.all(
      secretIds.map((SecretId) =>
        secretsManager
          .getSecretValue({
            SecretId,
          })
          .promise()
      )
    );

    return secrets.reduce(
      (accum, curr) => ({ ...accum, [curr.Name!]: curr.SecretString! }),
      {}
    ) as any;
  } catch (e) {
    throw new Error("Missing secrets");
  }
};
