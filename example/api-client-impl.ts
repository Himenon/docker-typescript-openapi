import type { ApiClient, QueryParameters } from "../lib/$types/v1.41";
import type * as Types from "./types";
import * as Formatter from "@himenon/openapi-parameter-formatter";
import * as http from "./http";

export const generateQueryString = (queryParameters: QueryParameters | undefined): string | undefined => {
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

  return queries.join("&");
};

export interface Params {
  socketPath: string;
}

export const create = (params: Params): ApiClient<Types.RequestOption> => {
  const { socketPath } = params;
  const apiClientImpl: ApiClient<Types.RequestOption> = {
    request: async (httpMethod, url, headers, requestBody, queryParameters): Promise<any> => {
      const query = generateQueryString(queryParameters);
      const requestUrl = query ? url + "?" + encodeURI(query) : url;
      const requestHeaders = {
        ...headers,
      };
      const response = await http.request({
        socketPath,
        headers: requestHeaders,
        path: requestUrl,
      });
      return response;
    },
  };
  return apiClientImpl;
};
