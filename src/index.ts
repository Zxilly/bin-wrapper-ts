import fs from 'node:fs';
import path from 'node:path';
import {isexe} from "isexe";
import {downloadAndExtract, download} from "./download";
import {execa, ExecaChildProcess} from "execa";

type Arch = typeof process.arch

interface SrcObject {
    url: string;
    os: string;
    arch: Arch;
}

interface CompressedSrcObject extends SrcObject {
    // The files in the compressed archive met the prefix will be extracted
    prefix: string;
    // The strip option is used to strip the directory levels from the extracted files
    strip: number;
}

type Validator = (path: fs.PathLike) => boolean

export default class BinWrapper {
    private sources: (SrcObject | CompressedSrcObject)[] = []
    private destination: string = ""
    private binName: string = ""
    private validators: { os?: string, arch?: Arch, validator: Validator }[] = []

    /**
     * Add a source
     * @param src The source URL to download from
     * @param os The OS to download for
     * @param arch The architecture to download for
     */
    src(src: string, os: string, arch: Arch): this {
        this.sources.push({url: src, os, arch});
        return this;
    }


    /**
     * Add a compressed source
     * @param src The source URL to download from
     * @param os The OS to download for
     * @param arch The architecture to download for
     * @param prefix The files in the compressed archive met the prefix will be extracted
     * @param strip strip the directory levels from the extracted files
     */
    compressedSrc(src: string, os: string, arch: Arch, prefix: string, strip: number): this {
        this.sources.push({url: src, os, arch, prefix, strip});
        return this;
    }

    /*
        * Add a validator
        * @param validator The validator function
        * @param os The OS to validate for
        * @param arch The architecture to validate for
     */
    validator(validator: Validator, os?: string, arch?: Arch): this {
        this.validators.push({validator, os, arch})
        return this
    }


    /*
     * Read the destination directory
     */
    dest(): string;
    /*
     * Set the destination directory
     * @param dest The destination directory
     */
    dest(dest: string): this;
    dest(dest?: string): this | string {
        if (dest === undefined) {
            return this.destination;
        }

        // ensure the destination exists and is a directory
        if (!this.exist(dest)) {
            this.createDir(dest)
        } else if (!this.isDirectory(dest)) {
            throw new Error(`The destination "${dest}" is not a directory`);
        }

        this.destination = dest;

        return this;
    }

    /*
     * Read the binary name
     */
    use(): string;
    /*
     * Set the binary name
     * @param bin The binary name
     */
    use(bin: string): this;
    use(bin?: string): this | string {
        if (bin === undefined) {
            return this.binName;
        }
        this.binName = bin;
        return this;
    }

    path(): string {
        return path.join(this.destination, this.binName);
    }

    async run(cmd: string[] = ['--version']): Promise<ExecaChildProcess> {
        await this.ensureExist()
        if (!(await this.canExec())) {
            throw new Error(`The binary "${this.path()}" is not executable`);
        }

        return execa(this.path(), cmd)
    }

    private getDownloadTargets(): (SrcObject | CompressedSrcObject)[] {
        const os = process.platform;
        const arch = process.arch;

        return this.sources.filter(src => {
            return src.os === os && src.arch === arch;
        });
    }

    async ensureExist(): Promise<void> {
        if (fs.existsSync(this.path())) {
            return;
        }
        await this.download()
        await this.grantExecutable()
        await this.validate()
    }

    private async download(): Promise<void> {
        const files = this.getDownloadTargets()

        if (files.length === 0) {
            throw new Error('No binary found for your platform');
        }

        await Promise.all(files.map(async file => {
            if ('prefix' in file && 'strip' in file) {
                await downloadAndExtract(file.url, this.destination, file.prefix, file.strip)
            }
            await download(file.url, path.join(this.destination, this.binName))
        }))
    }

    private async validate(): Promise<void> {
        const os = process.platform;
        const arch = process.arch;

        for (const {validator, os: validatorOs, arch: validatorArch} of this.validators) {
            if (validatorOs && validatorOs !== os) {
                continue;
            }
            if (validatorArch && validatorArch !== arch) {
                continue;
            }
            if (!validator(this.path())) {
                throw new Error(`The binary "${this.path()}" does not pass the validation`);
            }
        }
    }

    private exist(path: fs.PathLike): boolean {
        return fs.existsSync(path)
    }

    private isDirectory(path: fs.PathLike): boolean {
        return fs.statSync(path).isDirectory()
    }

    private canExec() {
        return isexe(this.path())
    }

    private async grantExecutable(): Promise<void> {
        if (await this.canExec()) {
            return;
        }
        fs.chmodSync(this.path(), 0o755);
    }

    private createDir(dir: string): void {
        fs.mkdirSync(dir, {recursive: true});
    }
}
