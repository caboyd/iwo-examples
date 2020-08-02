import copy from "rollup-plugin-copy";
import { readFileSync } from "fs-extra";
import { nodeResolve } from "@rollup/plugin-node-resolve";
// @ts-ignore
import sourceMaps from 'rollup-plugin-sourcemaps'
// @ts-ignore
import esmImportToUrl from "rollup-plugin-esm-import-to-url";
// @ts-ignore
import html from "@open-wc/rollup-plugin-html";
// @ts-ignore
import glslify from "rollup-plugin-glslify";

//Note: Do not use @rollup/plugin-typescript
// Breaks when:
//  - importing anything not relative (file vs ./file)
//  - compiled js files do not exist in the src directory
import typescript from "rollup-plugin-typescript2";

const pkg = require("./package.json");

const examples = {
    pbr_example: "PBR Example",
    sphere_geometry_example: "Sphere Geometry Example",
};

const template = readFileSync("examples/template.html", "utf-8");

const output_dir = "docs"

export default {
    //NOTE: Enable node_modules and src imports to keep in original files and location
    preserveModules: true,
    input: [
        ...Object.keys(examples).map(function(key) {
            return `examples/${key}.ts`;
        }),
    ],
    output: {
        dir: output_dir,
        format: "es",
        sourcemap: true
    },
    plugins: [

        esmImportToUrl({
            imports: {
                "gl-matrix": `https://unpkg.com/gl-matrix@${pkg.dependencies["gl-matrix"].replace(
                    /[\^*~]/,
                    ""
                )}/esm/index.js`,
            },
        }),

        //NOTE: Breaks when:
        //  - Using subst on windows to shortcut directories
        nodeResolve(),
        typescript(),
        //TODO: This is using a modified package and I need to fork it and publish the changes
        // This allows me to output html templates without the plugin thinking the module scripts are rollup entrypoints
        // Add this code after in rollup-plugin-html.js after line 83
        //  if(pluginOptions.skipModuleExtraction){
        //   htmlFiles.push({
        //     html: htmlData.html,
        //     inputModuleIds: [],
        //     htmlFileName,
        //     inlineModules: new Map(),
        //   });
        //   continue;
        // }
        // Add after line 32
        //  skipModuleExtraction: false,
        html({
            inject: true, //must be true or it will eat the script
            minify: false,
            skipModuleExtraction: true,
            //rootDir: "dist/examples", //plugin must be able to read modules from html so needs location of js files
            html: [
                ...Object.keys(examples).map(function(key, index) {
                    const html = template
                        .replace("</body>", `<script type="module" src="./${key}.js"></script></body>`)
                        .replace("</title>", `${examples[key]}</title>`);
                    return {
                        name: `examples/${key}.html`,
                        html: html,
                    };
                }),
            ],
        }),
        glslify({
            //compress removes spaces and new line breaks after keywords like 'else' breaking shaders with braces
            compress: false,
        }),
        copy({
            targets: [
                { src: "examples/assets/**/*", dest: output_dir },
                { src: "examples/index.html", dest: output_dir },
            ],
            // set flatten to false to preserve folder structure
            flatten: false,
        }),
        sourceMaps()
    ],
};

