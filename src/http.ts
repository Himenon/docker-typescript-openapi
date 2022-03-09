import * as http from "http";

export interface CreateRequestArgs {
  requestOptions: http.RequestOptions;
  requestBody?: string;
  hijack?: boolean;
}

const createRequest = async ({ requestOptions, requestBody, hijack }: CreateRequestArgs): Promise<http.IncomingMessage> => {
  const req = http.request(requestOptions);

  const cancelTimeout = (() => {
    const timer = setTimeout(() => {
      req.destroy();
    }, 10000);
    return () => clearTimeout(timer);
  })();

  if (requestBody) {
    req.write(requestBody);
  }

  if (hijack) {
    cancelTimeout();
    req.on("upgrade", function (res, sock, head) {
      console.log(sock);
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
    // req.on("finish", () => {
    //   cancelTimeout();
    //   reject();
    // })
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

const getResponse = async (res: http.IncomingMessage): Promise<any> => {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    res.on("data", chunk => {
      chunks.push(chunk);
    });
    res.on("error", error => {
      reject(error);
    });
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
  });
};

export interface RequestArgs {
  socketPath: string;
  method?: string;
  path?: string;
  headers?: http.OutgoingHttpHeaders;
  requestBody?: any;
  hijack?: boolean;
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
    requestHeaders;
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
    });
    return await getResponse(res);
  } catch (error) {
    if (error instanceof Error) {
      const errorMessage = [error.message, `${requestOptions.method}:${requestOptions.path}`].join("\n");
      throw new Error(errorMessage);
    } else {
      throw new Error("Unknown Error");
    }
  }
};
