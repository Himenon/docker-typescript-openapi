import type * as stream from "stream";

/**
 * @see https://github.com/apocas/docker-modem/blob/master/lib/modem.js#L359
 */
export const demuxStream = (stream: stream.Readable, stdout?: stream.Writable, stderr?: stream.Writable) => {
  let nextDataType: number | null = null;
  let nextDataLength: number | null = null;
  let buffer = Buffer.from("");
  function processData(data?: Buffer) {
    if (data) {
      buffer = Buffer.concat([buffer, data]);
    }
    if (!nextDataType) {
      if (buffer.length >= 8) {
        const header = bufferSlice(8);
        nextDataType = header.readUInt8(0);
        nextDataLength = header.readUInt32BE(4);
        // It's possible we got a "data" that contains multiple messages
        // Process the next one
        processData();
      }
    } else {
      if (nextDataLength !== null && buffer.length >= nextDataLength) {
        const content = bufferSlice(nextDataLength);
        if (nextDataType === 1) {
          stdout?.write(content);
        } else {
          stderr?.write(content);
        }
        nextDataType = null;
        // It's possible we got a "data" that contains multiple messages
        // Process the next one
        processData();
      }
    }
  }

  function bufferSlice(end: number) {
    const out = buffer.slice(0, end);
    buffer = Buffer.from(buffer.slice(end, buffer.length));
    return out;
  }

  stream.on("data", processData);
};
