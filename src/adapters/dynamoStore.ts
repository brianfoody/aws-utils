import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { Authoriser, AWSCredentials } from "../ports/authoriser";
import { Database, ItemNotFoundException } from "../ports/database";
import { makeCachedService } from "./cachedService";

type ProviderConfig = {
  tableName: string;
  region: string;
};

type ProviderPorts = {
  config: ProviderConfig;
  authoriser: Authoriser;
};

export const makeDynamoStore = <T, K>({
  authoriser,
  config,
}: ProviderPorts): Database<T, K> => {
  let dynamoCache = makeCachedService<DynamoDBDocumentClient>({
    authoriser,
    serviceFactory: (creds: AWSCredentials) =>
      DynamoDBDocumentClient.from(
        new DynamoDBClient({
          credentials: creds,
          region: config.region,
        })
      ),
  });

  return {
    get: async (key, props) => {
      const dynamo = await dynamoCache.get();

      const response = await dynamo.send(
        new GetCommand({
          Key: key,
          TableName: config.tableName,
          ConsistentRead: props?.strongRead,
        })
      );

      if (!response.Item) throw new ItemNotFoundException("Not found");

      return response.Item as T;
    },

    put: async (item, props) => {
      const dynamo = await dynamoCache.get();

      await dynamo.send(
        new PutCommand({
          Item: item,
          TableName: config.tableName,
          ConditionExpression: props?.condition,
        })
      );

      return item;
    },

    update: async (key, item) => {
      const dynamo = await dynamoCache.get();

      const itemKeys = Object.keys(item);

      await dynamo.send(
        new UpdateItemCommand({
          TableName: config.tableName,
          Key: marshall(key, { removeUndefinedValues: true }),
          ReturnValues: "NONE",
          UpdateExpression: `SET ${itemKeys
            .map((_, index) => `#field${index} = :value${index}`)
            .join(", ")}`,
          ExpressionAttributeNames: itemKeys.reduce(
            (accumulator, k, index) => ({
              ...accumulator,
              [`#field${index}`]: k,
            }),
            {}
          ),

          ExpressionAttributeValues: marshall(
            itemKeys.reduce(
              (accumulator, k, index) => ({
                ...accumulator,
                // @ts-ignore
                [`:value${index}`]: item[k],
              }),
              {}
            ),
            { removeUndefinedValues: true }
          ),
        })
      );

      return { ...item, ...key } as any as T;
    },
  };
};


