#!/usr/bin/env node

const pify = require("pify");
const fs = require("fs");
const es = require("event-stream");
const prependFile = require("prepend-file");

const match_req_regex = new RegExp(
  "(const|var|let)\\s+{?\\s*([\\w\\d_,]+)\\s*}?\\s*=\\s*require\\(\\s*('|\")([\\w\\d-.\\/]+)('|\")\\s*\\)(.[\\w\\d_]+)?"
);
//group 2 for selected imports


let enc = "utf-8";
let out = null;

const moveReqs = async (path, enc , out) => {
  if (!fs.existsSync(path)) {
    //async vers. is deprecated LOL!
    throw new Error("file path invalid");
  }
  // //backup
  // await pify(fs.copyFile)(path, `${path}.original`);
  // if (!fs.existsSync(`${path}.original`)) {
  //   throw new Error("could not generate copy. Aborting");
  // }

  //req_line -> imports
  const imports = new Map();

  try {
    const fileRead = new Promise((resolve, reject) => {
      fs.createReadStream(path, { encoding: enc })
        .pipe(es.split())
        .pipe(
          es.mapSync(async (line) => {
            const matches = line.match(match_req_regex);
            if (matches) {
              const load2Window = matches[2].split(",");
              imports.set(line, load2Window);
            }
            //line logic
          })
        )
        .on("error", (err) => {
          console.log("Error while reading file.", err);
          return reject();
        })
        .on("end", () => {
          console.debug(`Parsing complete!\n`);
          return resolve();
        });
    });

    await fileRead;
    let importStatements = "";
    for (const [key, value] of imports.entries()) {
      // console.log(`${key} imports ${value}`);

      //ignore comments
      if (key.startsWith("//") || key.startsWith("/*")) continue;
      //TODO fix for windows CRLF
      importStatements = importStatements.concat(key, "\n");
      for (const v of value) {
        importStatements = importStatements.concat(`window.${v} = ${v};`, "\n");
      }
    }
    //  console.info(importStatements);

    const pathlib = require("path");

    let preloadjsPath = null;
    if(out){
        //fs.lstatSync(out).isDirectory(); //check path okay
        fs.closeSync(fs.openSync(out, 'w')); //create the file
        preloadjsPath = out;
    } else {
      
      preloadjsPath = pathlib.join(pathlib.dirname(path), "preload.js");
    }


    if (!fs.existsSync(preloadjsPath)) {
      throw new Error(
        "preload.js not found!.Please provide such a file in the same folder or use the out arg."
      );
    }

    //backup
    await pify(fs.copyFile)(preloadjsPath, `${preloadjsPath}.original`);
    if (!fs.existsSync(`${preloadjsPath}.original`)) {
      throw new Error("could not generate copy. Aborting");
    }
    //TODO: allo custom encoding
    await pify(prependFile)(preloadjsPath, importStatements);
    console.info(`moved ${imports.size} imports to ${pathlib.basename(preloadjsPath)}`);
    
const msg = `
Remember! Add the ${pathlib.basename(preloadjsPath)} to the browserWindow like ...

new BrowserWindow({
  ...
  webPreferences: {
    nodeIntegration:false
    preload: path.join(__dirname, '${pathlib.basename(preloadjsPath)}')
}
`;
  
    console.log(msg);
    console.log(`\n Afterwards delete the requires in your ${pathlib.basename(path)} file`);
  } catch (e) {
    console.error(e.message);
  }
};

require("yargs") // eslint-disable-line
  .scriptName("reqs2preload")
  .command("$0 [file]",
    "move requires from <file> to preload.js",
    (yargs) => {
      yargs.positional("file", {
        describe: "to the window script file (normally called renderer.js)",
        default: 5000,
      });
    },
    async (argv) => {
      if (argv.out)
        out = argv.out;
      if (argv.enc) 
        enc = argv;
      moveReqs(argv.file,enc,out);
    }
  )
  .option("out", {
    alias: "o",
    type: "string",
    description: "Custom output file, instead of preload.js",
  })
  .option("encoding", {
    alias: "e",
    type: "string",
    description: "Custom encoding, default UTF8",
  }).argv;
