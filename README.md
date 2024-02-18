# bin-wrapper [![CI](https://github.com/Zxilly/bin-wrapper-ts/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/Zxilly/bin-wrapper-ts/actions/workflows/ci.yml)

> Binary wrapper that makes your programs seamlessly available as local dependencies, with TypeScript


## Install

```sh
npm install @zxilly/bin-wrapper
```


## Usage

```js
import path from 'node:path';
import BinWrapper from '@zxilly/bin-wrapper';

const gifsicleBase =
    'https://github.com/Zxilly/gifsicle-prebuilt/releases/download/v1.94/'

export const gifsicle = new BinWrapper()
    .src(`${gifsicleBase}gifsicle-linux-v1.94`, 'linux', 'x64')
    .src(`${gifsicleBase}gifsicle-macos-v1.94`, 'darwin', 'x64')
    .src(`${gifsicleBase}gifsicle-windows-v1.94.exe`, 'win32', 'x64')
    .dest(path.join('vendor'))
    .use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle')

const img2webpBase =
    'https://storage.googleapis.com/downloads.webmproject.org/releases/webp/'

export const img2webp = new BinWrapper()
    .compressedSrc(
        `${img2webpBase}libwebp-1.3.2-windows-x64.zip`,
        'win32',
        'x64',
        'img2webp',
        2
    )
    .compressedSrc(
        `${img2webpBase}libwebp-1.3.2-linux-x86-64.tar.gz`,
        'linux',
        'x64',
        'img2webp',
        2
    )
    .compressedSrc(
        `${img2webpBase}libwebp-1.3.2-mac-x86-64.tar.gz`,
        'darwin',
        'x64',
        'img2webp',
        2
    )
    .dest(path.join('vendor'))
    .use(process.platform === 'win32' ? 'img2webp.exe' : 'img2webp')

(async () => {
	const result = await gifsicle.run(['--version']);
	if (!result.failed) {
        console.log('gifsicle is working');
    }
})();
```

Get the path to your binary with `bin.path()`:

```js
console.log(bin.path());
//=> 'path/to/vendor/gifsicle'
```


## API

### src(src: string, os: string, arch: Arch): this

Add a source for the binary.

- `src`: The source URL to download from.
- `os`: The operating system to download for.
- `arch`: The architecture to download for.

Returns the instance of `BinWrapper` for chaining.

### compressedSrc(src: string, os: string, arch: Arch, prefix: string, strip: number): this

Add a compressed source for the binary.

- `src`: The source URL to download from.
- `os`: The operating system to download for.
- `arch`: The architecture to download for.
- `prefix`: The files in the compressed archive met the prefix will be extracted.
- `strip`: The strip option is used to strip the directory levels from the extracted files.

Returns the instance of `BinWrapper` for chaining.

### dest(): string

Get the destination directory where the binary will be stored.

### dest(dest: string): this

Set the destination directory where the binary will be stored.

- `dest`: The destination directory.

Returns the instance of `BinWrapper` for chaining.

### use(): string

Get the name of the binary.

### use(bin: string): this

Set the name of the binary.

- `bin`: The binary name.

Returns the instance of `BinWrapper` for chaining.

### path(): string

Get the full path of the binary.

### async run(cmd: string[] = ['--version']): Promise<void>

Run the binary with the specified command. It will ensure the binary exists and is executable before running.

- `cmd`: The command to run with the binary.

### async ensureExist(): Promise<void>

Ensure the binary exists and is executable. If not, it will download the binary and grant execution permission.

### validator(validator: Validator, os?: string, arch?: Arch): this

Add a validator for the binary.

## License

MIT
