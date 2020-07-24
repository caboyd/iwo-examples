const HtmlWebpackExternalsPlugin = require("html-webpack-externals-plugin");
const common = require("./webpack.common");

const buildExamplesConfig = (env, argv) => {
    return {
        entry: common.entry,
        externals: common.externals,
        plugins: [
            ...common.plugins,
            //These needs to be after the HtmlWebpackPlugin's for the scripts to be added into templates
            ...Object.keys(common.examples).map(function(id) {
                return new HtmlWebpackExternalsPlugin({
                    files: [`examples/${id}.html`],
                    publicPath: "../",
                    externals: common.plugins_externals
                });
            }),
            {
                apply: compiler => {
                    compiler.hooks.afterEmit.tap("AfterEmitPlugin", compilation => {
                        console.log(compilation);
                    });
                },
            },
        ],
        resolve: common.resolve,
        module: common.module,
        devtool: "source-map",
    };
};

module.exports = [buildExamplesConfig];
