import { API_ENUM, API_OBJECT, API_OPERATION_TYPE_MAP } from '../api';

const createCallApiMap = (
  basePath?: string,
  interceptor?: (config: any) => any,
): API_OPERATION_TYPE_MAP => {
  const callApiMap: API_OPERATION_TYPE_MAP = {} as any;

  for (const apiClientName in API_OBJECT) {
    if (Object.prototype.hasOwnProperty.call(API_OBJECT, apiClientName)) {
      const ApiClient = API_OBJECT[
        apiClientName as keyof typeof API_OBJECT
      ] as (typeof API_OBJECT)[API_ENUM];
      const apiClient = new ApiClient(basePath);
      if (interceptor) apiClient.addInterceptor(interceptor as any);

      callApiMap[apiClientName] = apiClient;
    }
  }

  return callApiMap;
};

export { createCallApiMap };
