# Electron-helper: Move require statements from render.js to preload.js

This script should help migration of old [Electron](https://www.electronjs.org/) apps to support the 
new security policy forbidding ```require``` in the renderer.

This is controlled by : ```nodeIntegration:false;``` (which is now the default)

The script will automatically copy the ```require``` calls to the preload.js from a given file (default renderer.js). Every imported library/module will be exposed into the window.


### Install
```bash
npm install malger/reqs2preload -g
```

### How to run:
```bash
reqs2preload --help
```


### Backup?
Ofcourse the orginal ```preload.js``` file will be saved as backup ```preload.js.orginal```
The render.js file stays untouched. One must remove the statments manually!
