const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ImageminPlugin = require("imagemin-webpack-plugin").default;
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

const examples = {
    pbr_example: "PBR Example",
    sphere_geometry_example: "Sphere Geometry Example",
};

module.exports = {
    examples: examples,
    entry: Object.keys(examples).reduce(function(accum, key) {
        return { ...accum, [`examples/${key}`]: `examples/${key}.ts` };
    }, {}),
    output: Object.keys(examples).reduce(function(accum, key) {
        return { ...accum, filename: "[name].js", sourceMapFilename: "[name].js.map", libraryTarget: '' };
    }, {}),
    externals: {
        "gl-matrix": "glMatrix",
        iwo: "iwo",
    },
    plugins: [
        new HtmlWebpackPlugin({
            chunks: [""],
            filename: "index.html",
            template: "examples/index.html",
        }),
        ...Object.keys(examples).map(function(id) {
            return new HtmlWebpackPlugin({
                chunks: [`examples/${id}`],
                filename: `examples/${id}.html`,
                template: "examples/template.html",
                title: `IWO Renderer - ${examples[id]}`,
                minify: {
                    collapseWhitespace: false,
                    minifyCSS: false,
                },
            });
        }),
        new ImageminPlugin({
            test: /\.(jpe?g|png|gif|svg)$/i,
            jpegtran: {
                progressive: true,
            },
            optipng: {
                optimizationLevel: 3,
            },
        }),
        new CopyPlugin({
            patterns: [
                { from: "node_modules/gl-matrix/gl-matrix.js", to: "glmatrix", flatten: true },
                { from: "node_modules/gl-matrix/esm/*", to: "glmatrix/esm", flatten: true },
            ],
        }),
    ],
    plugins_externals: [
        {
            module: "gl-matrix",
            entry: "gl-matrix.js",
            global: "glMatrix",
        },
        // {
        //     module: "ts-pbr-renderer",
        //     entry: "dist/iwo.js",
        //     global: "iwo",
        // }
    ],

    resolve: {
        modules: [path.resolve(__dirname), "src", "node_modules"],
        // Add `.ts` and `.tsx` as a resolvable extension.
        extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js", ".vert", ".frag"],

        plugins: [new TsconfigPathsPlugin({ configFile: "./tsconfig.json" })],
    },

    module: {
        rules: [
            {
                test: /\.js$/,
                enforce: "pre",
                use: ["source-map-loader"],
            },
            // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
            },
            {
                test: /\.(glsl|vs|fs|frag|vert)$/,
                loader: "raw-loader",
            },
            {
                test: /\.(glsl|vs|fs|frag|vert)$/,
                loader: "string-replace-loader",
                options: {
                    multiple: [
                        { search: "\\r", replace: "", flags: "g" },
                        { search: "[ \\t]*\\/\\/.*\\n", replace: "", flags: "g" }, // remove //
                        { search: "[ \\t]*\\/\\*[\\s\\S]*?\\*\\/", replace: "", flags: "g" }, // remove /* */
                        { search: "\\n{2,}", replace: "\n", flags: "g" }, // # \n+ to \n
                        { search: "\\s\\s+", replace: " ", flags: "g" }, // reduce multi spaces to singles
                    ],
                },
            },
            {
                test: /\.(txt|obj|mtl)$/,
                loader: "raw-loader",
            },
            {
                test: /\.(gif|jpeg|jpg|png|svg|hdr)$/,
                use: [
                    {
                        loader: "file-loader",
                        options: {
                            name: "[path][name].[ext]",
                            esModule: false,
                        },
                    },
                ],
            },
        ],
    },
};
