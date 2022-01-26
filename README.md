# ARACNE
Monorepo manager

## Origin
I created this library because I was too lazy to learn [lerna](https://github.com/lerna/lerna/) or to find an alternative to it and my ideas were clear enough about what I was looking for to give me the courage to reinvent the wheel.

## Name origin
"Aracne" is the name of a greek mitological character, very able to weave.

## Usage
After the installation you can run the available [commands](#commands), shown below, simply running:
> aracne *\<command>*

or
> npx aracne *\<command>*

## Commands
### `import`
It allows you to import external packages (not remotely).  
_Special thanks to [lerna](https://github.com/lerna/lerna/), from which it was taken the code for the file path rebase in commits._

### `changed`
It allows you to receive a list of packages that need a version increase.

### `build`
It allows you to build packages and link their internal dependencies.  
You can let Aracne know how to build your packages configuring the ["build" property](#build-1).
> Packages building can't be split from the internal dependencies linking, because the internal dependencies installation addresses the packed package and not the source folder, avoiding symlinks

### `version`
It allows you to increment the packages version that need it.  
This command also runs [build](#build) and automatically commits the edits. This behavior can be suppressed add the `--increase-only` option.

### `restore`
It allows you to replace the local installation of internal dependencies with their current version in "package.json" files.  
This allows you to prepare the package for publishing in the registry.

### `publish`
It allows you to publish the packages in the registry.  
This command also runs [version](#version), [restore](#restore) and, after the publishing in the registry, [build](#build).

## Configuration
You can configure aracne creating a file named "aracne.json" in your project root folder having a valid JSON content.

Following the configurable properties.
### `"build"`
This defines the command that will be run to build the packages.  
It can be `null`, a string, an array of string or an object having as keys the name of the package or "\*", to select them all, and as value `null`, to skip the build, or a string or an array of string, defining the command to run.

### `"lang"`
### `"manager"`
### `"packages"`
### `"publish"`
### `"source"`
This defines what file implies the need of package version increase after the their editing.  
It can be a string, an array of string or an object having as keys the name of the package or "\*", to select them all, and as value a string or an array of string.  

The values follow the extended glob pattern.