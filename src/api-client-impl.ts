import type { ApiClient, QueryParameters } from "./v1.41";
import * as Formatter from "@himenon/openapi-parameter-formatter";
import * as http from "./http";
import type { Socket } from "net";

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

export interface RequestOptions {
  hijack?: boolean;
  callback?: (sock: Socket) => void;
}

export const create = (params: Params): ApiClient<RequestOptions> => {
  const { socketPath } = params;
  const apiClientImpl: ApiClient<RequestOptions> = {
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
        callback: requestOptions?.callback,
      });
      return response;
    },
  };
  return apiClientImpl;
};
