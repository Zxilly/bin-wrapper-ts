import got from "got";
import fs from "node:fs";
import {pipeline} from 'stream';
import {promisify} from 'util';
import {temporaryFileTask} from "tempy";
import {decompress} from "./decompress";

const streamPipeline = promisify(pipeline);

export async function download(url: string, target: string) {
    const downloadStream = got.stream(url);
    const fileWriterStream = fs.createWriteStream(target);

    await streamPipeline(downloadStream, fileWriterStream);
}

export async function downloadAndExtract(url: string, target: string, prefix: string, strip: number) {
    await temporaryFileTask(async tempFile => {
        await download(url, tempFile);

        await decompress(tempFile, target, (filename) => filename.startsWith(prefix), strip);
    })
}
