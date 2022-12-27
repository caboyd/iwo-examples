// vite.config.js
import { resolve } from "path";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import vitePluginString from "vite-plugin-string";

const examples = [
    "pbr_example",
    "pbr_post_processing_example",
    "sphere_geometry_example",
    "line_geometry_example",
    "gltf_example",
    "obj_example",
    "frustum_example",
    "shadows_example",
    "instance_example",
    "billboard_example",
];

export default defineConfig({
    build: {
        minify: false,
        rollupOptions: {
            input: examples.map((name) => `/examples/${name}.html`),
        },
        sourcemap: true,
    },

    base: "./", //for proper relative links
    server: {
        port: 8080,
        open: true,
    },
    resolve: {
        alias: [
            //We need to match all @ but skip @vite to not break it
            { find: /(?!\@vite)\@/, replacement: "/iwo/src/" },
            { find: "iwo", replacement: "/iwo/src/iwo" },
            { find: "imgui-js", replacement: "/lib/imgui-js" },
        ],
    },
    plugins: [
        vitePluginString({
            include: [`**/*.vert`, `**/*.frag`],
        }),
        viteStaticCopy({
            targets: [
                { src: "iwo-assets/examples/**/*", dest: "iwo-assets" },
                { src: "index.html", dest: "" },
                { src: "examples/*.css", dest: "" },
            ],
            flatten: false,
        }),
    ],
});
