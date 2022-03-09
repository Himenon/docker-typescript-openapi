import { Client } from "../src/v1.41";
import * as ApiClientImpl from "../src/api-client-impl";
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
