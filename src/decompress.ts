import * as fs from 'fs';
import * as path from 'path';
import * as tar from 'tar';
import * as yauzl from 'yauzl';
import {pipeline} from 'stream';
import {Entry} from "yauzl";
import {fileTypeFromBuffer, fileTypeFromStream} from "file-type";

async function decompressTar(filePath: string, targetPath: string, filter: (filename: string, path: string) => boolean, strip: number): Promise<void> {
    return tar.x({
        file: filePath,
        cwd: targetPath,
        filter: (pathname) => filter(path.basename(pathname), pathname),
        strip: strip
    });
}

async function decompressZip(filePath: string, targetPath: string, filter: (filename: string, path: string) => boolean, strip: number): Promise<void> {
    return new Promise((resolve, reject) => {
        yauzl.open(filePath, {lazyEntries: true}, (err, zipfile) => {
            if (err) reject(err);

            zipfile.readEntry();

            zipfile.on('entry', (entry: Entry) => {
                const components = entry.fileName.split('/');

                let strippedComponents = components.slice(strip);

                if (strippedComponents.length === 0) {
                    strippedComponents = [components[components.length - 1]]
                    return;
                }

                const strippedPath = strippedComponents.join('/');

                if (!filter(path.basename(strippedPath), strippedPath)) {
                    zipfile.readEntry();
                    return;
                }

                zipfile.openReadStream(entry, (err, readStream) => {
                    if (err) reject(err);

                    const dir = path.dirname(filePath);

                    fs.mkdir(dir, {recursive: true}, (err) => {
                        if (err) reject(err);

                        const writeStream = fs.createWriteStream(filePath);
                        pipeline(readStream, writeStream, (err) => {
                            if (err) reject(err);
                            zipfile.readEntry();
                        });
                    });
                });
            });

            zipfile.once('end', resolve);
        });
    });
}

async function decompress(filePath: string, targetPath: string, filter: (filename: string, path: string) => boolean, strip: number): Promise<void> {
    const buf = fs.readFileSync(filePath);
    const fileType = await fileTypeFromBuffer(buf)

    switch (fileType?.ext) {
        case 'gz':
        case 'xz':
        case 'tar':
            return decompressTar(filePath, targetPath, filter, strip);
        case 'zip':
            return decompressZip(filePath, targetPath, filter, strip);
        default:
            throw new Error(`Unsupported file type: ${fileType}`);
    }
}
