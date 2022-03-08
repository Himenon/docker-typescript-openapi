import { Client } from "../lib/v1.41";
import * as ApiClientImpl from "./ApiClientImpl";
import nodeFetch from "node-fetch";

const main = async () => {
  const apiClientImpl = ApiClientImpl.create({
    fetch: nodeFetch,
  });
  const client = new Client(apiClientImpl, "/var/run/docker.sock");
  const imageList = await client.ImageList({
    parameter: {},
  });
  console.log(imageList);
};


main();

