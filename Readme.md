# Electron-helper: Move require statements from render.js to preload.js

This script should help migration of old [Electron](https://www.electronjs.org/) apps to support the 
new security policy forbidding ```require``` in the renderer.

This is controlled by : ```nodeIntegration:false;``` (which is now the default)

The script will automatically move the require calls to the preload.js from a given file (default renderer.js). Every imported library/module will be exposed into the window.


### Install
```bash
npm install malger/reqs2preload -g
```

### How to run:
```bash
reqs2preload --help
```
