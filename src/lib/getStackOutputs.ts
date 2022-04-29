import * as AWS from "aws-sdk";

export const stackVersionPostfix = process.env.CIRCLE_BUILD_NUM
  ? "-" + process.env.CIRCLE_BUILD_NUM
  : "";

export const getStackOutputs = async <T extends string>(
  stackName: string,
  outputs: T[]
): Promise<{ [p in T]: string }> => {
  const ret = await new AWS.CloudFormation({
    region: process.env.AWS_REGION,
  })
    .describeStacks({
      StackName: stackName,
    })
    .promise();

  if (!ret.Stacks)
    throw new Error(
      `Describing the '${stackName}' stacks returned with no stacks, cannot continue.`
    );

  if (ret.Stacks.length != 1)
    throw new Error(
      `Describing the '${stackName}' stacks returned with '${ret.Stacks.length}' stacks, there should be exactly 1.`
    );

  const stack = ret.Stacks[0];

  if (!stack.Outputs)
    throw new Error(
      `Stack description from '${stackName}' is missing outputs, cannot continue`
    );

  const stackOutputs = stack.Outputs;

  const returnedOuptputs = outputs.reduce((accum, k) => {
    const output = stackOutputs.find(
      (o) =>
        o.OutputKey != null &&
        o.OutputKey != undefined &&
        o.OutputKey.includes(k)
    );
    if (!output)
      throw new Error(
        `Couldnt not find the '${k}' output in the '${stackName}' stack, exiting`
      );

    if (!output.OutputValue)
      throw new Error(
        `The value of the output from '${k}' in the '${stackName}' stack is null or undefined, cannot continue`
      );

    return { ...accum, [k]: output.OutputValue };
  }, {}) as any;

  console.log(`Outputs loaded`, returnedOuptputs);

  return returnedOuptputs;
};
