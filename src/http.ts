import * as http from "http";
import type { Socket } from "net";
import type * as stream from "stream";

export interface CreateRequestArgs {
  requestOptions: http.RequestOptions;
  requestBody?: string;
  hijack?: boolean;
  callback?: (sock: stream.Readable) => void;
  /** millseconds */
  timeout?: number;
}

const createRequest = async ({ requestOptions, requestBody, hijack, callback, timeout }: CreateRequestArgs): Promise<http.IncomingMessage> => {
  const req = http.request(requestOptions);

  const cancelTimeout = (() => {
    if (!timeout) {
      return () => undefined;
    }
    const timer = setTimeout(() => {
      req.destroy();
    }, timeout);
    return () => clearTimeout(timer);
  })();

  if (requestBody) {
    req.write(requestBody);
  }

  if (hijack) {
    cancelTimeout();
    req.on("upgrade", function (res, sock, head) {
      console.log(sock);
      callback?.(sock);
    });
  } else {
    req.end();
  }

  return new Promise((resolve, reject) => {
    req.on("connect", () => {
      cancelTimeout();
    });
    req.on("close", () => {
      cancelTimeout();
    });
    req.on("response", res => {
      cancelTimeout();
      resolve(res);
    });
    req.on("error", error => {
      cancelTimeout();
      reject(error);
    });
  });
};

export interface CreateResponseArgs {
  res: http.IncomingMessage;
  isStream?: boolean;
  callback?: (res: stream.Readable) => void;
}

const createResponse = async ({ res, isStream, callback }: CreateResponseArgs): Promise<any> => {
  const chunks: any[] = [];
  res.on("data", chunk => {
    chunks.push(chunk);
  });

  return new Promise((resolve, reject) => {
    res.on("error", error => {
      reject(error);
    });
    if (isStream) {
      if (!callback) {
        throw new Error("Please use callback");
      }
      callback(res);
    } else {
      res.on("end", () => {
        const buffer = Buffer.concat(chunks);
        if (res.statusCode && 400 <= res.statusCode) {
          const errorMessage = `[HTTP Code: ${res.statusCode}] ${res.statusMessage}.`;
          const error = new Error(errorMessage);
          reject(error);
        }
        const text = buffer.toString();
        try {
          const json = JSON.parse(text);
          resolve(json);
        } catch (error) {
          resolve(text);
        }
      });
    }
  });
};

export interface RequestArgs {
  socketPath: string;
  method?: string;
  path?: string;
  headers?: http.OutgoingHttpHeaders;
  requestBody?: any;
  hijack?: boolean;
  isStream?: boolean;
  onHijackRequest?: (stream: stream.Readable) => void;
  onResponse?: (stream: stream.Readable) => void;
  /** millseconds */
  timeout?: number;
}

export const request = async (args: RequestArgs): Promise<any> => {
  const requestBody: string | undefined = !!args.requestBody ? JSON.stringify(args.requestBody) : undefined;
  const requestHeaders = {
    ...args.headers,
  };
  if (requestBody) {
    requestHeaders["Content-Length"] = Buffer.byteLength(requestBody, "utf-8");
  }
  if (args.hijack) {
    requestHeaders["Transfer-Encoding"] = "chunked";
    requestHeaders.Connection = "Upgrade";
    requestHeaders.Upgrade = "tcp";
  }
  const requestOptions: http.RequestOptions = {
    method: args.method,
    socketPath: args.socketPath,
    path: args.path,
    headers: requestHeaders,
  };
  try {
    const res = await createRequest({
      requestOptions,
      requestBody,
      hijack: args.hijack,
      callback: args.onHijackRequest,
      timeout: args.timeout,
    });
    return await createResponse({ res, callback: args.onResponse, isStream: args.isStream });
  } catch (error) {
    if (error instanceof Error) {
      const errorMessage = [error.message, `${requestOptions.method}:${requestOptions.path}`].join("\n");
      throw new Error(errorMessage);
    } else {
      throw new Error("Unknown Error");
    }
  }
};
