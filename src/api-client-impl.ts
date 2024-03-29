import type { ApiClient, QueryParameters } from "./v1.41";
import * as Formatter from "@himenon/openapi-parameter-formatter";
import * as http from "./http";
import type * as stream from "stream";

export const generateQueryString = (queryParameters: QueryParameters | undefined, additionalString?: string): string | undefined => {
  if (!queryParameters) {
    return undefined;
  }
  const queries = Object.entries(queryParameters).reduce<string[]>((queryStringList, [key, item]) => {
    if (!item.value) {
      return queryStringList;
    }
    if (!item.style) {
      return queryStringList.concat(`${key}=${item.value}`);
    }
    const result = Formatter.QueryParameter.generate(key, item as Formatter.QueryParameter.Parameter);
    if (result) {
      return queryStringList.concat(result);
    }
    return queryStringList;
  }, []);

  if (additionalString) {
    return [...queries, additionalString].join("&");
  }
  return queries.join("&");
};

export interface Params {
  socketPath: string;
}

export interface Options {
  hijack?: boolean;
  isStream?: boolean;
  onHijackRequest?: (socket: stream.Readable) => void;
  onResponse?: (res: stream.Readable) => void;
}

export const create = (params: Params): ApiClient<Options> => {
  const { socketPath } = params;
  const apiClientImpl: ApiClient<Options> = {
    request: async (httpMethod, url, headers, requestBody, queryParameters, requestOptions): Promise<any> => {
      // Docker's openapi Schema incorrectly uses filters as query parameter
      const { filters, ...omitedQueryParamsteres } = queryParameters || {};
      const query = generateQueryString(omitedQueryParamsteres, filters?.value);
      const requestUrl = query ? url + "?" + encodeURI(query) : url;
      const requestHeaders = {
        ...headers,
      };
      const response = await http.request({
        socketPath: socketPath,
        method: httpMethod,
        headers: requestHeaders,
        path: requestUrl,
        requestBody: requestBody,
        hijack: requestOptions?.hijack,
        isStream: requestOptions?.isStream,
        onHijackRequest: requestOptions?.onHijackRequest,
        onResponse: requestOptions?.onResponse,
      });
      return response;
    },
  };
  return apiClientImpl;
};
