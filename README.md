# bin-wrapper [![CI](https://github.com/Zxilly/bin-wrapper-ts/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/Zxilly/bin-wrapper-ts/actions/workflows/ci.yml)

> Binary wrapper that makes your programs seamlessly available as local dependencies, with TypeScript


## Install

```sh
npm install @zxilly/bin-wrapper
```


## Usage

```js
import path from 'node:path';
import BinWrapper from '@xhmikosr/bin-wrapper';

const base = 'https://github.com/imagemin/gifsicle-bin/raw/main/vendor';
const bin = new BinWrapper()
	.src(`${base}/macos/gifsicle`, 'darwin')
	.src(`${base}/linux/x64/gifsicle`, 'linux', 'x64')
	.src(`${base}/win/x64/gifsicle.exe`, 'win32', 'x64')
	.dest(path.join('vendor'))
	.use(process.platform === 'win32' ? 'gifsicle.exe' : 'gifsicle')

(async () => {
	await bin.run(['--version']);
	console.log('gifsicle is working');
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


## License

MIT
