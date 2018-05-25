const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const webpack = require('webpack');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const backendShortcuts = {
    sec: 'https://secure.gooddata.com',
    secure: 'https://secure.gooddata.com',
    stg: 'https://staging.intgdc.com',
    stg2: 'https://staging2.intgdc.com',
    stg3: 'https://staging3.intgdc.com',
    demo: 'https://client-demo-be.na.intgdc.com',
    developer: 'https://developer.na.gooddata.com'
};

const defaultBackend = backendShortcuts.developer;

module.exports = async (env) => {
    const basePath = env && env.basePath || ''; // eslint-disable-line no-mixed-operators
    const backendParam = env ? env.backend : '';
    const backendUrl = backendShortcuts[backendParam] || backendParam || defaultBackend;
    console.log('Backend URI: ', backendUrl); // eslint-disable-line no-console

    const isProduction = process.env.NODE_ENV === 'production';

    const proxy = {
        '/gdc': {
            target: backendUrl,
            secure: false,
            cookieDomainRewrite: '',
            headers: {
                host: backendUrl.split('/')[2],
                origin: null
            }
            // onProxyReq: (proxyReq) => {
            //     console.log('proxy', '/gdc', proxyReq.path);
            //     if (proxyReq.method === 'DELETE' && !proxyReq.getHeader('content-length')) {
            //         // Only set content-length to zero if not already specified
            //         proxyReq.setHeader('content-length', '0');
            //     }
            // }
        },
        '/api': {
            target: 'http://localhost:3009',
            secure: false,
            onProxyReq: (req) => {
                console.log(`Proxy ${req.path} to http://localhost:3009 (use /examples/server)`);
            }
        }
    };


    const resolve = {
        extensions: ['.js', '.jsx'],
        alias: {
            '@gooddata/react-components/styles': path.resolve(__dirname, '../styles/'),
            '@gooddata/react-components': path.resolve(__dirname, '../dist/'),
            'ag-grid': path.resolve(__dirname, '../node_modules/ag-grid')
        }
    };

    const plugins = [
        new CleanWebpackPlugin(['dist']),
        new HtmlWebpackPlugin({
            title: 'GoodData React Components'
        }),
        new CircularDependencyPlugin({
            exclude: /node_modules|dist/,
            failOnError: true
        }),
        new webpack.DefinePlugin({
            BACKEND_URL: JSON.stringify(backendUrl),
            BASEPATH: JSON.stringify(basePath),
            'process.env': {
                // This has effect on the react lib size
                NODE_ENV: JSON.stringify(isProduction ? 'production' : 'development')
            }
        })
    ];

    if (isProduction) {
        const uglifyOptions = {
            mangle: true,
            compress: {
                sequences: true,
                dead_code: true,
                drop_debugger: true,
                conditionals: true,
                booleans: true,
                unused: true,
                if_return: true,
                join_vars: true,
                warnings: false
            }
        };

        plugins.push(
            new webpack.optimize.OccurrenceOrderPlugin(),

            new webpack.optimize.ModuleConcatenationPlugin(),

            new UglifyJsPlugin({
                uglifyOptions,
                parallel: true
            }),
            new CompressionPlugin({
                asset: '[file].gz',
                algorithm: 'gzip'
            }),
            function collectStats() {
                this.plugin('done', (stats) => {
                    const filename = path.join(__dirname, 'dist', 'stats.json');
                    const serializedStats = JSON.stringify(stats.toJson(), null, '\t');
                    require('fs').writeFileSync(filename, serializedStats);
                });
            }
        );
    }

    return {
        entry: ['./src/index.jsx'],
        plugins,
        output: {
            filename: '[name].[hash].js',
            path: path.join(__dirname, 'dist'),
            publicPath: `${basePath}/`
        },
        devtool: isProduction ? false : 'cheap-module-eval-source-map',
        node: {
            __filename: true
        },
        module: {
            rules: [
                {
                    test: /\.css$/,
                    loaders: ['style-loader', 'css-loader']
                },
                {
                    test: /.scss$/,
                    loaders: ['style-loader', 'css-loader', 'sass-loader']
                },
                {
                    test: /\.jsx?$/,
                    exclude: /node_modules|update-dependencies/,
                    use: {
                        loader: 'babel-loader'
                    }
                },
                {
                    test: /\.(jpe?g|gif|png|svg|ico|eot|woff2?|ttf|wav|mp3)$/,
                    use: 'file-loader'
                }
            ]
        },
        devServer: {
            contentBase: path.join(__dirname, 'dist'),
            historyApiFallback: true,
            compress: true,
            port: 8999,
            stats: { chunks: false, assets: false, modules: false, hash: false, version: false },
            proxy
        },
        resolve
    };
};
