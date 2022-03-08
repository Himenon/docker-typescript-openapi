import { Client } from "../lib/v1.41";
import * as ApiClientImpl from "./api-client-impl";
import * as fs from "fs";

const main = async () => {
  const apiClientImpl = ApiClientImpl.create({
    socketPath: "/var/run/docker.sock",
  });
  const client = new Client(apiClientImpl, "");

  fs.mkdirSync("debug", { recursive: true });

  const imageList = await client.ImageList({
    parameter: {},
  });
  fs.writeFileSync("debug/docker-images.json", JSON.stringify(imageList, null, 2), "utf-8");

  const containerList = await client.ContainerList({
    parameter: {},
  });
  fs.writeFileSync("debug/docker-containers.json", JSON.stringify(containerList, null, 2), "utf-8");
};

main();
