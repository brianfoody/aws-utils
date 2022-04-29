export interface CloudFunction<T, U> {
  invokeSync: (payload: T) => Promise<U>;
}
