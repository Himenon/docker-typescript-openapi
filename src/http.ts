import * as http from "http";

export interface RequestArgs {
  socketPath: string;
  path?: string;
  headers?: http.OutgoingHttpHeaders;
}

export const request = async (args: RequestArgs): Promise<any> => {
  const requestOptions: http.RequestOptions = {
    socketPath: args.socketPath,
    path: args.path,
    headers: args.headers,
  };
  const req = http.request(requestOptions);
  req.end();
  req.on("information", info => {
    console.log(`Got information prior to main response: ${info.statusCode}`);
  });
  return new Promise(resolve => {
    req.on("response", res => {
      const chunks: any[] = [];
      res.on("data", chunk => {
        chunks.push(chunk);
      });
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
    });
  });
};
