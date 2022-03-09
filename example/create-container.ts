import { Client } from "../src/v1.41";
import * as ApiClientImpl from "../src/api-client-impl";
import * as fs from "fs";
import * as path from "path";

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
    await client.ContainerDelete({
      parameter: {
        id: container.Id,
      },
    });
  });
  await Promise.all(removeTasks);
  const filename1 = "debug/docker-create-container.json";
  const createdContainer = await client.ContainerCreate({
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
      StopTimeout: 1000,
      Shell: ["date"],
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
  console.log(createdContainer);
  fs.writeFileSync(filename1, JSON.stringify(createdContainer, null, 2), "utf-8");
  console.log(`Output: ${filename1}`);
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
