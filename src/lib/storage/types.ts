export interface StoredObject {
  key: string;
  url: string;
  contentType: string;
  size: number;
}

export interface ImageStorage {
  readonly name: string;
  put(options: {
    key: string;
    data: Buffer;
    contentType: string;
  }): Promise<StoredObject>;
  get(key: string): Promise<{ data: Buffer; contentType: string } | null>;
  delete?(key: string): Promise<void>;
}
