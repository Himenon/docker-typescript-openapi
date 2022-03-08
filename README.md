# @himenon/docker-typescript-openapi

```bash
yarn add @himenon/docker-typescript-openapi
```

## Usage

```ts
import { Client } from "@himenon/docker-typescript-openapi/v1.41";
import * as ApiClientImpl from "@himenon/docker-typescript-openapi/api-client-impl";
import * as fs from "fs";

const main = async () => {
  const apiClientImpl = ApiClientImpl.create({
    socketPath: "/var/run/docker.sock",
  });
  const client = new Client(apiClientImpl, "");

  fs.mkdirSync("debug", { recursive: true });

  const filename1 = "debug/docker-images.json";
  const imageList = await client.ImageList({
    parameter: {},
  });
  fs.writeFileSync(filename1, JSON.stringify(imageList, null, 2), "utf-8");
  console.log(`Output: ${filename1}`);

  const filename2 = "debug/docker-containers.json";
  const containerList = await client.ContainerList({
    parameter: {},
  });
  fs.writeFileSync(filename2, JSON.stringify(containerList, null, 2), "utf-8");
  console.log(`Output: ${filename2}`);
};

main();
```

## Build

```ts
yarn run build
```

## OpenAPI Source for Docker

- <https://docs.docker.com/engine/api>

## OpenAPI TypeScript Code Generator

- [@himenon/openapi-typescript-code-generator](https://github.com/Himenon/openapi-typescript-code-generator)

You can also just use the type definition

## Use Another Version

Edit [config.ts](./scripts/config.ts)

## LICENCE

[@Himenon/docker-typescript-openapi](https://github.com/Himenon/docker-typescript-openapi)・MIT
