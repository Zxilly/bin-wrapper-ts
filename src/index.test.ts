import BinWrapper from '../src/index';
import path from "node:path";
import { describe, beforeEach, expect, it, jest } from "@jest/globals";

describe('BinWrapper', () => {
    let binWrapper: BinWrapper;

    beforeEach(() => {
        binWrapper = new BinWrapper();

        jest.spyOn((<any>binWrapper), 'createDir').mockImplementation(() => {});
        jest.spyOn(<any>binWrapper, 'grantExecutable').mockImplementation(() => Promise.resolve());
        jest.spyOn((<any>binWrapper), 'isDirectory').mockImplementation(() => true);
        jest.spyOn((<any>binWrapper), 'exist').mockImplementation(() => true);
    });

    describe('src', () => {
        it('should add a source', () => {
            const src = 'https://example.com/bin';
            const os = 'linux';
            const arch = 'x64';

            binWrapper.src(src, os, arch);

            expect(binWrapper['sources']).toEqual([{ url: src, os, arch }]);
        });
    });

    describe('compressedSrc', () => {
        it('should add a compressed source', () => {
            const src = 'https://example.com/bin.tar.gz';
            const os = 'linux';
            const arch = 'x64';
            const prefix = 'bin/';
            const strip = 1;

            binWrapper.compressedSrc(src, os, arch, prefix, strip);

            expect(binWrapper['sources']).toEqual([{ url: src, os, arch, prefix, strip }]);
        });
    });

    describe('dest', () => {
        it('should read the destination directory', () => {
            const dest = binWrapper.dest();

            expect(dest).toBe('');
        });

        it('should set the destination directory', () => {
            const dest = '/path/to/destination';

            binWrapper.dest(dest);

            expect(binWrapper.dest()).toBe(dest);
        });
    });

    describe('use', () => {
        it('should read the binary name', () => {
            const bin = binWrapper.use();

            expect(bin).toBe('');
        });

        it('should set the binary name', () => {
            const bin = 'binary';

            binWrapper.use(bin);

            expect(binWrapper.use()).toBe(bin);
        });
    });

    describe('path', () => {
        it('should return the path of the binary', () => {
            const dest = '/path/to/destination';
            const bin = 'binary';
            binWrapper.dest(dest);
            binWrapper.use(bin);

            const pat = binWrapper.path();

            expect(pat).toBe(path.join(dest, bin));
        });
    });

    describe('run', () => {
        it('should ensure the binary exists and throw an error if it is not executable', async () => {
            const dest = '/path/to/destination';
            const bin = 'binary';
            binWrapper.dest(dest);
            binWrapper.use(bin);

            jest.spyOn(binWrapper, 'ensureExist').mockImplementationOnce(() => Promise.resolve());
            jest.spyOn((<any>binWrapper), 'canExec').mockImplementationOnce(() => Promise.resolve(false));

            await expect(binWrapper.run()).rejects.toThrowError(`The binary "${binWrapper.path()}" is not executable`);
            expect(binWrapper.ensureExist).toHaveBeenCalled();
            expect((<any>binWrapper).canExec).toHaveBeenCalled();
        });

        it('should ensure the binary exists and not throw an error if it is executable', async () => {
            const dest = '/path/to/destination';
            const bin = 'binary';
            binWrapper.dest(dest);
            binWrapper.use(bin);

            jest.spyOn(binWrapper, 'ensureExist').mockImplementationOnce(() => Promise.resolve());
            jest.spyOn((<any>binWrapper), 'canExec').mockImplementationOnce(() => Promise.resolve(true));

            await expect(binWrapper.run()).resolves.toBeUndefined();
            expect(binWrapper.ensureExist).toHaveBeenCalled();
            expect((<any>binWrapper).canExec).toHaveBeenCalled();
        });

        it('should ensure the binary exists with custom command and throw an error if it is not executable', async () => {
            const dest = '/path/to/destination';
            const bin = 'binary';
            binWrapper.dest(dest);
            binWrapper.use(bin);

            const cmd = ['custom', 'command'];

            jest.spyOn(binWrapper, 'ensureExist').mockImplementationOnce(() => Promise.resolve());
            jest.spyOn((<any>binWrapper), 'canExec').mockImplementationOnce(() => Promise.resolve(false));

            await expect(binWrapper.run(cmd)).rejects.toThrowError(`The binary "${binWrapper.path()}" is not executable`);
            expect(binWrapper.ensureExist).toHaveBeenCalled();
            expect((<any>binWrapper).canExec).toHaveBeenCalled();
        });

        it('should ensure the binary exists with custom command and not throw an error if it is executable', async () => {
            const dest = '/path/to/destination';
            const bin = 'binary';
            binWrapper.dest(dest);
            binWrapper.use(bin);

            const cmd = ['custom', 'command'];

            jest.spyOn(binWrapper, 'ensureExist').mockImplementationOnce(() => Promise.resolve());
            jest.spyOn((<any>binWrapper), 'canExec').mockImplementationOnce(() => Promise.resolve(true));

            await expect(binWrapper.run(cmd)).resolves.toBeUndefined();
            expect(binWrapper.ensureExist).toHaveBeenCalled();
            expect((<any>binWrapper).canExec).toHaveBeenCalled();
        });
    });
});
