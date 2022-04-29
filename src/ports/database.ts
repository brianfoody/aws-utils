export class RecordExistsError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "RecordExistsError";
    Object.setPrototypeOf(this, RecordExistsError.prototype);
  }
}

export class ItemNotFoundException extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "ItemNotFoundException";
    Object.setPrototypeOf(this, ItemNotFoundException.prototype);
  }
}

type GetProps = {
  strongRead?: boolean;
};

export interface Database<T, K> {
  get: (key: K, props?: GetProps) => Promise<T>;
  put: (item: T, props?: { condition: string }) => Promise<T>;
  update: (key: K, item: Partial<Omit<T, keyof K>>) => Promise<T>;
}
