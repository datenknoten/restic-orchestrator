# restic orchestrator

With [restic]() you can do fine backups on individual hosts. With
restic orchestrator you can do that on multiple hosts.

[![Greenkeeper badge](https://badges.greenkeeper.io/datenknoten/restic-orchestrator.svg)](https://greenkeeper.io/)
[![Maintainability](https://api.codeclimate.com/v1/badges/ce6dd39b99956c60f655/maintainability)](https://codeclimate.com/github/datenknoten/restic-orchestrator/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/ce6dd39b99956c60f655/test_coverage)](https://codeclimate.com/github/datenknoten/restic-orchestrator/test_coverage) [![Build Status](https://travis-ci.org/datenknoten/restic-orchestrator.svg?branch=greenkeeper%2Finitial)](https://travis-ci.org/datenknoten/restic-orchestrator)

## Install

I'm building [releases](https://github.com/datenknoten/restic-orchestrator/releases) for linux amd64 with [nexe](https://github.com/nexe/nexe), which you can
find the release section.

You can also clone this repo and run the orchestrator from your
shell:

```
$ git clone https://github.com/datenknoten/restic-orchestrator
$ cd restic-orchestrator
$ npm install
$ npm start
```

You need at least node 8.

## Usage

You need to put a [config file](examples/config.json) in one of these
directories:

| OS      | Path                                                                                                     |
|---------|----------------------------------------------------------------------------------------------------------|
| Linux   | `$XDG_DATA_HOME/restic-orchestrator/config.json` or `$HOME/.local/share/restic-orchestrator/config.json` |
| Windows | `%APPDATA%/datenknoten/restic-orchestrator/config.json`                                                  |
| Mac OSX | `$HOME/Library/Application Support/restic-orchestrator/config.json`                                      |

Then run `restic-orchestrator` everytime you want to do a backup.

## Development

If you want to write code for this project, you are welcome! Please
make sure to write tests for your code, respect the linter and make
sure that the typescript compiler can comile your code into
javascript:

```
$ npm run lint
$ npm run test
$ npm run compile
```

In the
[git-hooks](https://github.com/datenknoten/restic-orchestrator/tree/develop/git-hooks)
directory are also some git hooks you can install to enforce better
working conditions.
