import { AxiosRequestConfig } from 'axios';
import crypto from 'crypto';

const excludeKeys = ['access_token', 'sign'] as const;

/**
 * Generate signature for TikTok API requests
 * @param requestOption - Request options
 * @param app_secret - TikTok app secret
 * @returns Generated signature
 */
export const generateSign = (
  requestOption: AxiosRequestConfig,
  app_secret: string,
): string => {
  let signString = '';
  // step1: Extract all query parameters excluding sign and access_token. Reorder the parameter keys in alphabetical order:
  const params = requestOption.params || {};
  const sortedParams = Object.keys(params)
    .filter((key) => !excludeKeys.includes(key as any))
    .sort()
    .map((key) => ({ key, value: params[key] }));
  //step2: Concatenate all the parameters in the format {key}{value}:
  const paramString = sortedParams
    .map(({ key, value }) => `${key}${value}`)
    .join('');

  signString += paramString;

  //step3: Append the string from Step 2 to the API request path:
  const url = requestOption.url || '';
  const pathname = new URL(
    url.startsWith('http') ? url : `https://example.com${url}`,
  ).pathname;

  signString = `${pathname}${paramString}`;

  //step4: If the request header content-type is not multipart/form-data, append the API request body to the string from Step 3:
  if (
    requestOption.headers?.['content-type'] !== 'multipart/form-data' &&
    requestOption.data &&
    Object.keys(requestOption.data).length
  ) {
    const body = JSON.stringify(requestOption.data);
    signString += body;
  }

  //step5: Wrap the string generated in Step 4 with the app_secret:
  signString = `${app_secret}${signString}${app_secret}`;

  //step6: Encode your wrapped string using HMAC-SHA256:
  const hmac = crypto.createHmac('sha256', app_secret);
  hmac.update(signString);
  const sign = hmac.digest('hex');

  return sign;
};
