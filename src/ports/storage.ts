export type File = {
  bucket: string;
  key: string;
};

export type FileOptions = {
  contentType?: string;
};

export interface Storage<T> {
  getUploadUrl: (item: File, contentType: string) => Promise<string>;
  putItem: (
    item: File,
    contents: string,
    options: FileOptions
  ) => Promise<File>;
  putJson: (item: File, contents: T) => Promise<File>;
  getItem: (item: File) => Promise<string>;
  getShareUrl: (item: File) => Promise<string>;
  deleteItem: (item: File) => Promise<void>;
  getJson: (item: File) => Promise<T>;
}
