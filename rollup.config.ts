//import merge from "deepmerge";
import { createBasicConfig } from "@open-wc/building-rollup";
import html from "@open-wc/rollup-plugin-html";
//import typescript from "@rollup/plugin-typescript";

import copy from "rollup-plugin-copy";
import { readFileSync } from "fs-extra";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
//import autoExternal from "rollup-plugin-auto-external";
import alias from "@rollup/plugin-alias";
//import multiInput from "rollup-plugin-multi-input";
import esmImportToUrl from "rollup-plugin-esm-import-to-url";
import { string } from "rollup-plugin-string";
//import url from '@rollup/plugin-url';
import glslify from 'rollup-plugin-glslify';
import typescript2 from "rollup-plugin-typescript2";
import * as path from "path";

const pkg = require("./package.json");

const examples = {
    pbr_example: "PBR Example",
    sphere_geometry_example: "Sphere Geometry Example",
};

const projectRootDir = path.resolve(__dirname);

const template = readFileSync("examples/template.html", "utf-8");

const baseConfig = createBasicConfig({
    developmentMode: true,
    outputDir: "dist",
    //preserveModules: true,
    // preserveSymlinks: true,
    // treeshake: false,
    nodeResolve: false,
    babel: false,
    terser: false,
});

//export default merge(baseConfig, {
export default {
    // input: Object.keys(examples).reduce(function(accum, key) {
    //     return { ...accum, [`examples/${key}`]: `examples/${key}.ts` };
    // }, {}),
    input: [
        // ...Object.keys(examples).map(function(key) {
        //     return `examples/${key}.ts`;
        // }),
        "examples/pbr_example.ts",
    ],
    //input: 'examples/pbr_example.ts',
    output: {
        dir: "dist",
        format: "es",
    },
    // manualChunks: {
    //     "gl-matrix" : ["gl-matrix"]
    // },
    plugins: [

        // html({
        //     inject: true, //must be true or it will eat the script
        //     minify: false,
        //     rootDir: "dist/examples", //plugin must be able to read modules from html so needs access to js file
        //     html: [
        //         ...Object.keys(examples).map(function(key, index) {
        //             const html = template
        //                 .replace("</body>", `<script type="module" src="../${key}.js"></script></body>`)
        //                 .replace("</title>", `${examples[key]}</title>`);
        //             return {
        //                 name: `examples/${key}.html`,
        //                 html: html,
        //             };
        //         }),
        //     ],
        // }),


        typescript2({
        }),
        esmImportToUrl({
            imports: {
                "gl-matrix": `https://unpkg.com/gl-matrix@${pkg.dependencies["gl-matrix"].replace(
                    /[\^*~]/,
                    ""
                )}/esm/index.js`,
            },
        }),
        alias({
            entries: [
                {
                    //Fixes path aliasing in ts-pbr-renderer for non typescript/node_module imports
                    find: 'src',
                    //Must begin with / for resolver to work
                    replacement: './src',
                    customResolver : nodeResolve({
                        customResolveOptions: {
                            basedir: path.resolve(projectRootDir, 'ts-pbr-renderer'),
                        }
                    })
                }
            ],
        }),
        //required to import anaything not relative (file vs ./file)
        //This breaks when using subst on windows to shortcut directories
        nodeResolve({
            browser: true,
            //modulesOnly: true,

            extensions: [ '.mjs', '.js', '.frag', '.vert', '.json'],
            customResolveOptions: {
                //Tries to resolve from examples folder unless this is set
               // basedir: process.cwd(),
                extensions: [ '.mjs', '.js', '.frag', '.vert', '.json'],
               // preserveSymlinks: true
            },

        }),

        glslify({
            compress: false
        }),
        //multiInput({ relative: 'examples/' }),
        // https://github.com/open-wc/open-wc/blob/bcc2481b4e4f50886f072e7c5e05ef5e881d710a/packages/rollup-plugin-html/src/getEntrypointBundles.js#L66
        // ...Object.keys(examples).map(function(key, index) {
        //     return html({
        //         //setting html or files strips the entrypoints from the bundle so they can't be used to insert script into the template
        //         //files: 'examples/template.html',
        //         name: `examples/${key}.html`,
        //         inject: false,
        //         minify: false,
        //         template({ inputHtml, bundle, bundles }) {
        //             // console.log(bundle.entrypoints);
        //             inputHtml = template.replace("</title>", `${examples[key]}</title>`);
        //             return inputHtml.replace(
        //                 "</body>",
        //                 `<script type="module" src="${bundle.entrypoints[index].importPath}"></script></body>`
        //             );
        //         },
        //     });
        // }),
        // commonjs(),
        // autoExternal(),
        copy({
            targets: [
                { src: "examples/assets/**/*", dest: "dist" },
                { src: "examples/index.html", dest: "dist" },
                { src: "examples/index2.html", dest: "dist" },
                //TODO: need to think about how I will bundle glMatrix and IWO. may want to just copy
                { src: "node_modules/gl-matrix/gl-matrix.js", dest: "dist" },
            ],
            // set flatten to false to preserve folder structure
            flatten: false,
        }),

        // string({
        //     // Required to be specified
        //     include: ["**/*.json", "**/*.vert"],
        //
        // }),
        // {
        //     resolveId(importee, importer) {
        //         console.log(importee);
        //     }
        // },


    ],
};
//});
