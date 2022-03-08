import * as http from "http";

export interface RequestArgs {
  socketPath: string;
  method?: string;
  path?: string;
  headers?: http.OutgoingHttpHeaders;
  requestBody?: any;
}

const getIncomingMessage = async (req: http.ClientRequest): Promise<http.IncomingMessage> => {
  return new Promise((resolve, reject) => {
    req.on("response", (res) => {
      resolve(res);
    });
    req.on("error", (error) => {
      reject(error);
    });
  })
}

const getResponse = async (res: http.IncomingMessage): Promise<any> => {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    res.on("*", console.info);
    res.on("data", chunk => {
      chunks.push(chunk);
    });
    res.on("error", (error) => {
      reject(error);
    })
    res.on("end", () => {
      const buffer = Buffer.concat(chunks);
      const result = buffer.toString();
      try {
        const json = JSON.parse(result);
        resolve(json);
      } catch (error) {
        resolve(buffer);
      }
    });
  })
}

export const request = async (args: RequestArgs): Promise<any> => {
  const hasRequestBody = !!args.requestBody;
  const stringifiedRequestBody = hasRequestBody ? JSON.stringify(args.requestBody) : "";
  const requestHeaders = {
    ...args.headers,
  };
  if (hasRequestBody) {
    requestHeaders["Content-Length"] =  Buffer.byteLength(stringifiedRequestBody, 'utf-8');
  }
  const requestOptions: http.RequestOptions = {
    method: args.method,
    socketPath: args.socketPath,
    path: args.path,
    headers: requestHeaders,
  };
  const req = http.request(requestOptions);
  if (hasRequestBody) {
    req.write(stringifiedRequestBody);
  }
  req.end();
  const res = await getIncomingMessage(req);
  return getResponse(res);
};
