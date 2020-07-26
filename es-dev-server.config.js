
const path = require("path");

const   nodeResolve = require("@rollup/plugin-node-resolve");
const fs = require('fs');

module.exports = {
    port: 8080,
    watch: true,
    nodeResolve: {
        browser: true,
        //modulesOnly: true,

        extensions: [".mjs", ".js", ".frag", ".vert", ".json"],
        customResolveOptions: {
            //Tries to resolve from examples folder unless this is set
            // basedir: process.cwd(),
            extensions: [".mjs", ".js", ".frag", ".vert", ".json"],
            // preserveSymlinks: true
        },
    },
    preserveSymlinks: true,
    appIndex: "demo/index.html",
    plugins: [
        {
            transform(context) {
                // if (context.response.is("js")) {
                //     //TODO: Read the files for shaders and embed the text into the JS file
                //     const transformed = context.body.replace()
                //     console.log(context);
                //     do{
                //         if(/(.frag|.vert)/.test(source)){
                //             return fs.readFileSync(path.resolve(process.cwd(),"ts-pbr-renderer/src/shaders", source.replace(/^.*[\\\/]/, '')));
                //         }
                //     } while(/(.frag|.vert)/.test(source))
                //
                // }
            },
        },
        {
            async resolveImport({ source, context }) {
              //  console.log(source);
               // console.log(context);
                if(/(.frag|.vert)/.test(source)){
                    return fs.readFileSync(path.resolve(process.cwd(),"ts-pbr-renderer/src/shaders", source.replace(/^.*[\\\/]/, '')));
                }
            },
        },
    ],
    moduleDirs: ["node_modules", "web-modules", "dist", "dist/ts-pbr-renderer", "dist/ts-pbr-renderer/src"],
};
