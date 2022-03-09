# @himenon/docker-typescript-openapi

```bash
yarn add @himenon/docker-typescript-openapi
```

## Usage

### Get Docker Image

[Example Code](example/get-docker-images.ts)

```ts
import { Client } from "@himenon/docker-typescript-openapi/v1.41";
import * as ApiClientImpl from "@himenon/docker-typescript-openapi/api-client-impl";
import * as fs from "fs";

const main = async () => {
  const apiClientImpl = ApiClientImpl.create({
    socketPath: "/var/run/docker.sock",
  });
  const client = new Client(apiClientImpl, "/v1.41");

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

### Output Logs

[Example Code](example/get-container-log.ts)

```ts
import { Client } from "@himenon/docker-typescript-openapi/v1.41";
import * as ApiClientImpl from "@himenon/docker-typescript-openapi/api-client-impl";
import * as fs from "fs";
import * as path from "path";
import * as stream from "stream";

const main = async () => {
  const apiClientImpl = ApiClientImpl.create({
    socketPath: "/var/run/docker.sock",
  });
  const client = new Client(apiClientImpl, "/v1.41");

  fs.mkdirSync("debug", { recursive: true });
  const currentDir = path.resolve("example");
  const containerName = "create-from-api";

  const alreadyUsedContainers = await client.ContainerList({
    parameter: {
      all: true,
      filters: `name=${containerName}`,
    },
  });
  const removeTasks = alreadyUsedContainers.map(async container => {
    if (!container.Id) {
      return;
    }
    if (container.State === "running") {
      await client.ContainerStop({
        parameter: {
          id: container.Id,
        },
      });
    }

    await client.ContainerDelete({
      parameter: {
        id: container.Id,
      },
    });
  });
  await Promise.all(removeTasks);
  const filename1 = "debug/docker-create-container.json";
  const container = await client.ContainerCreate({
    headers: {
      "Content-Type": "application/json",
    },
    parameter: {
      name: containerName,
    },
    requestBody: {
      Image: "golang:1.17",
      WorkingDir: "/app",
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      OpenStdin: true,
      Cmd: ["ls"],
      HostConfig: {
        Mounts: [
          {
            Type: "bind",
            Source: currentDir,
            Target: "/app",
          },
        ],
      },
    },
  });

  fs.writeFileSync(filename1, JSON.stringify(container, null, 2), "utf-8");
  console.log(`Output: ${filename1}`);

  await client.ContainerStart({
    parameter: {
      id: container.Id,
    },
  });

  const logStream = new stream.PassThrough();
  logStream.on("data", chunk => {
    console.log(chunk.toString("utf-8"));
  });

  await client.ContainerLogs(
    {
      headers: {
        Accept: "application/json",
      },
      parameter: {
        id: container.Id,
        stdout: true,
        stderr: true,
        follow: true,
        tail: "all",
      },
    },
    {
      isStream: true,
      callback: res => {
        res.on("data", chunks => {
          logStream.write(chunks);
        });
        res.on("end", () => {
          logStream.end();
        });
      },
    },
  );
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
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

## Debugging

Docker Engine Logs

**Mac OS**

```bash
tail -f ~/Library/Containers/com.docker.docker/Data/log/host/com.docker.driver.amd64-linux.log
```

## LICENCE

[@Himenon/docker-typescript-openapi](https://github.com/Himenon/docker-typescript-openapi)・MIT
