import { Client } from "../src/v1.41";
import * as ApiClientImpl from "../src/api-client-impl";
import * as fs from "fs";
import * as path from "path";
import * as stream from "stream";
import { demuxStream } from "./utils";

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
  const logFileStream = fs.createWriteStream("debug/docker-container.log", "utf-8");

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
        demuxStream(res, logStream, logStream);
        demuxStream(res, logFileStream, logFileStream);
        res.on("data", chunks => {
          logStream.write(chunks);
        });
        res.on("end", () => {
          logStream.end();
          logFileStream.end();
        });
      },
    },
  );
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
