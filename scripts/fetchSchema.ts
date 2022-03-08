import * as fs from "fs";
import * as path from "path";
import fetch from "node-fetch";
import * as Shell from "./tools/shell";
import rimraf from "rimraf";
import { versions, outputDir } from "./config";
import * as yaml from "js-yaml";

export const getSwaggerSchema = async (version: string): Promise<any> => {
  const url = `https://docs.docker.com/engine/api/${version}.yaml`;
  try {
    const res = await fetch(url);
    const yamlText = await res.text();
    return yaml.load(yamlText);
  } catch (error) {
    throw error as any;
  }
};

const convert = async (inputFilename: string, outputFilename: string): Promise<void> => {
  await Shell.shell(`swagger2openapi ${inputFilename} -o ${outputFilename}`);
};

const main = async () => {
  const tempDir = `.tmp-${outputDir}`;
  fs.mkdirSync(tempDir, { recursive: true });
  rimraf.sync(outputDir);
  fs.mkdirSync(outputDir, { recursive: true });
  const tasks = versions.map(async version => {
    const swaggerShema = await getSwaggerSchema(version);
    const swaggerFilename = path.join(tempDir, `swagger-${version}.json`);
    const openapiFilename = path.join(outputDir, `openapi-${version}.json`);
    fs.writeFileSync(swaggerFilename, JSON.stringify(swaggerShema, null, 2), { encoding: "utf-8" });
    await convert(swaggerFilename, openapiFilename);
  });
  await Promise.all(tasks);
  rimraf.sync(tempDir);
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
