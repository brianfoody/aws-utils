import { Lambda } from "aws-sdk";
import { CloudFunction } from "../ports/cloudFunction";

interface LambdaConfig {
  timeoutInSeconds: number;
  functionName: string;
}

export const makeLambdaAdapter = <T, U>({
  functionName,
  timeoutInSeconds,
}: LambdaConfig): CloudFunction<T, U> => {
  const lambda = new Lambda({
    httpOptions: {
      timeout: timeoutInSeconds * 1000,
    },
  });

  return {
    invokeSync: async (payload) => {
      const result = await lambda
        .invoke({
          FunctionName: functionName,
          InvocationType: "RequestResponse",
          Payload: JSON.stringify(payload),
        })
        .promise();

      if (result.FunctionError)
        throw new Error(
          `InvokeError on ${functionName}; ${result.FunctionError}`
        );

      return JSON.parse(result.Payload as string);
    },
  };
};
