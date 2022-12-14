//@ts-nocheck
import copy from "rollup-plugin-copy";
import { readFileSync } from "fs-extra";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import sourceMaps from "rollup-plugin-sourcemaps";
import esmImportToUrl from "rollup-plugin-esm-import-to-url";
// /import html from "@open-wc/rollup-plugin-html";
import glslify from "rollup-plugin-glslify";

import html from "@rollup/plugin-html";

//Note: Do not use @rollup/plugin-typescript
// Breaks when:
//  - importing anything not relative (file vs ./file)
//  - compiled js files do not exist in the src directory
import typescript from "rollup-plugin-typescript2";

const pkg = require("./package.json");

const examples = {
    pbr_example: "PBR Example",
    sphere_geometry_example: "Sphere Geometry Example",
    line_geometry_example: "Line Geometry Example",
    gltf_example: "glTF Model Example",
    obj_example: "Obj Model Example",
    frustum_example: "Camera Frustum Example",
    shadows_example: "Shadows Example",
    pbr_post_processing_example: "PBR with Post Processing Example",
    instance_example: "Instanced Rendering Example",
    billboard_example: "Billboard Example",
};

const template = readFileSync("examples/template.html", "utf-8");

const output_dir = "docs";

export default {
    //NOTE: Enable node_modules and src imports to keep in original files and location
    preserveModules: true,
    input: Object.keys(examples).map((key) => `examples/${key}.ts`),
    output: {
        dir: output_dir,
        format: "es",
        sourcemap: true,
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
        ...Object.keys(examples).map((key) =>
            html({
                fileName: `examples/${key}.html`,
                template: ({ attributes, bundle, files, publicPath, title }) => {
                    const html = template
                        .replace("</body>", `<script type="module" src="./${key}.js"></script></body>`)
                        .replace("</title>", `${examples[key]}</title>`);
                    return html;
                },
            })
        ),
        glslify({
            //compress removes spaces and new line breaks after keywords like 'else' breaking shaders without braces
            compress: true,
        }),
        copy({
            targets: [
                { src: "iwo-assets/examples/**/*", dest: output_dir + "/iwo-assets" },
                { src: "examples/index.html", dest: output_dir },
                { src: "examples/*.css", dest: output_dir },
            ],
            // set flatten to false to preserve folder structure
            flatten: false,
        }),
        sourceMaps(),
    ],
};
