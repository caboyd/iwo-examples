import merge from "deepmerge";
import { createBasicConfig } from "@open-wc/building-rollup";
import html from "@open-wc/rollup-plugin-html";
import typescript from "@rollup/plugin-typescript";
import copy from "rollup-plugin-copy";
import { readFileSync } from "fs-extra";

const examples = {
    pbr_example: "PBR Example",
    sphere_geometry_example: "Sphere Geometry Example",
};

const template = readFileSync("examples/template.html", "utf-8");

const baseConfig = createBasicConfig({
    developmentMode: true,
    outputDir: "dist",
    nodeResolve: {
        nodeResolve: true,
        modulesOnly: true,
    },
    babel: false,
    terser: false,
});

export default merge(baseConfig, {
    // input: Object.keys(examples).reduce(function(accum, key) {
    //     return { ...accum, [`examples/${key}`]: `examples/${key}.ts` };
    // }, {}),
    // input: [
    //     ...Object.keys(examples).map(function(key) {
    //         return `examples/${key}.ts`;
    //     }),
    // ],
    external: ["glMatrix"],
    plugins: [
        html({
            inject: true, //must be true or it will eat the script
            minify: false,
            rootDir: "dist", //plugin must be able to read modules from html so needs access to js file
            html: [
                ...Object.keys(examples).map(function(key, index) {
                    const html = template
                        .replace("</body>", `<script type="module" src="../${key}.js"></script></body>`)
                        .replace("</title>", `${examples[key]}</title>`);
                    return {
                        name: `examples/${key}.html`,
                        html: html,
                    };
                }),
            ],
        }),

        //This requires getEntrypointBundles.js to be modified because adding files eat the input entrypoints.
        //Files can not have inputmodules so will be stripped from the entry points
        //https://github.com/open-wc/open-wc/blob/bcc2481b4e4f50886f072e7c5e05ef5e881d710a/packages/rollup-plugin-html/src/getEntrypointBundles.js#L66
        //  ...Object.keys(examples).map(function(key,index) {
        //      return html({
        //          files: 'examples/template.html',
        //          name: `examples/${key}.html`,
        //          inject: false,
        //          minify: false,
        //          template({ inputHtml,bundle ,bundles}) {
        //              inputHtml = inputHtml.replace('</title>',
        //                  `${examples[key]}</title>`)
        //              return inputHtml.replace(
        //                  '</body>',
        //                  `<script type="module" src="${bundle.entrypoints[index].importPath}"></script></body>`,
        //              );
        //          },
        //      });
        //  }),

        typescript({}),
        copy({
            targets: [
                { src: "examples/assets/**/*", dest: "dist/assets" },
                { src: "examples/index.html", dest: "dist" },
                //TODO: need to think about how I will bundle glMatrix and IWO. may want to just copy
            ],
            // set flatten to false to preserve folder structure
            flatten: false,
        }),
    ],
});
