module.exports = {
    port: 8080,
    watch: true,
    compress: true,
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
    appIndex: "dist/index.html",
    plugins: [],
    moduleDirs: ["node_modules", "web-modules"],
};
