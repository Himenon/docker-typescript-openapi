import { Client } from "../lib/v1.41";
import * as ApiClientImpl from "../lib/api-client-impl";
import * as fs from "fs";
import * as path from "path";

const main = async () => {
  const apiClientImpl = ApiClientImpl.create({
    socketPath: "/var/run/docker.sock",
  });
  const client = new Client(apiClientImpl, "");

  fs.mkdirSync("debug", { recursive: true });

  const currentDir = path.resolve("example");

  const filename1 = "debug/docker-create-container.json";
  const createdContainer = await client.ContainerCreate({
    headers: {
      "Content-Type": "application/json",
    },
    parameter: {
      name: "from-api",
    },
    requestBody: {
      Image: "golang:1.17",
      WorkingDir: "/app",
      AttachStdout: true,
      Volumes: {
        [currentDir]: "/app",
      },
      Shell: ["ls"],
    },
  });
  console.log(createdContainer);
  fs.writeFileSync(filename1, JSON.stringify(createdContainer, null, 2), "utf-8");
  console.log(`Output: ${filename1}`);
};

main();
