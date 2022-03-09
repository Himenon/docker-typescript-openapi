import * as http from "http";

export interface RequestArgs {
  socketPath: string;
  method?: string;
  path?: string;
  headers?: http.OutgoingHttpHeaders;
  requestBody?: any;
}

const createRequest = async (requestOption: http.RequestOptions, requestBody?: string): Promise<http.IncomingMessage> => {
  const req = http.request(requestOption);

  const cancelTimeout = (() => {
    const timer = setTimeout(() => {
      req.destroy();
    }, 10000)
    return () => clearTimeout(timer);
  })();
  if (requestBody) {
    req.write(requestBody);
  }
  req.end();
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
    req.on("response", (res) => {
      cancelTimeout();
      resolve(res);
    });
    req.on("error", (error) => {
      cancelTimeout();
      reject(error);
    });
  })
}

const getResponse = async (res: http.IncomingMessage): Promise<any> => {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    res.on("data", chunk => {
      chunks.push(chunk);
    });
    res.on("error", (error) => {
      reject(error);
    })
    res.on("end", () => {
      const buffer = Buffer.concat(chunks);
      if (res.statusCode && 400 <= res.statusCode) {
        const errorMessage = `[HTTP Code: ${res.statusCode}] ${res.statusMessage}.`;
        const error = new Error(errorMessage);
        reject(error);
      }
      try {
        const result = buffer.toString();
        const json = JSON.parse(result);
        resolve(json);
      } catch (error) {
        resolve(buffer);
      }
    });
  })
}

export const request = async (args: RequestArgs): Promise<any> => {
  const requestBody: string | undefined = !!args.requestBody ? JSON.stringify(args.requestBody) : undefined;
  const requestHeaders = {
    ...args.headers,
  };
  if (requestBody) {
    requestHeaders["Content-Length"] = Buffer.byteLength(requestBody, 'utf-8');
  }
  const requestOptions: http.RequestOptions = {
    method: args.method,
    socketPath: args.socketPath,
    path: args.path,
    headers: requestHeaders,
  };
  try {
    const res = await createRequest(requestOptions, requestBody);
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
