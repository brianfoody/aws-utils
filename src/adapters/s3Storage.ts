import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Authoriser, AWSCredentials } from "../ports/authoriser";
import { File, Storage } from "../ports/storage";

import { makeCachedService } from "./cachedService";

type ProviderConfig = {
  bucketName: string;
  region: string;
};

type ProviderPorts = {
  config: ProviderConfig;
  authoriser: Authoriser;
};

export const makeS3Storage = <T>({
  authoriser,
  config,
}: ProviderPorts): Storage<T> => {
  let s3Cache = makeCachedService<S3Client>({
    authoriser,
    serviceFactory: (creds: AWSCredentials) =>
      new S3Client({ credentials: creds, region: config.region }),
  });

  const getItem = async (file: File): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const s3 = await s3Cache.get();

        const response = await s3.send(
          new GetObjectCommand({
            Bucket: file.bucket,
            Key: file.key,
          })
        );

        let responseDataChunks: string[] = [];

        // @ts-ignore
        response.Body.on("data", (chunk: string) =>
          responseDataChunks.push(chunk)
        );

        // @ts-ignore
        response.Body.once("end", () => resolve(responseDataChunks.join("")));
      } catch (err) {
        return reject(err);
      }
    });
  };

  return {
    putJson: async (file, item) => {
      await (
        await s3Cache.get()
      ).send(
        new PutObjectCommand({
          Bucket: file.bucket,
          Key: file.key,
          Body: Buffer.from(JSON.stringify(item)),
          ContentType: "application/json",
        })
      );
      return file;
    },
    putItem: async (file, item, options) => {
      await (
        await s3Cache.get()
      ).send(
        new PutObjectCommand({
          Bucket: file.bucket,
          Key: file.key,
          Body: Buffer.from(item),
          ContentType: options?.contentType,
        })
      );

      return file;
    },
    getShareUrl: async (file) => {
      const command = new GetObjectCommand({
        Bucket: file.bucket,
        Key: file.key,
      });
      return getSignedUrl(await s3Cache.get(), command, {
        expiresIn: 86400,
      });
    },
    getUploadUrl: async (file, contentType) => {
      const s3 = await s3Cache.get();
      const command = new PutObjectCommand({
        Bucket: file.bucket,
        Key: file.key,
        ContentType: contentType,
      });
      return getSignedUrl(s3, command, { expiresIn: 86400 });
    },
    getJson: async (file) => {
      const item = await getItem(file);
      return JSON.parse(item);
    },
    getItem: getItem,
    deleteItem: async (file) => {
      await (
        await s3Cache.get()
      ).send(
        new DeleteObjectCommand({
          Bucket: file.bucket,
          Key: file.key,
        })
      );
    },
  };
};
