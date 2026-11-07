const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

/**
 * Configuración de Webpack para el Backend NestJS de LaLaLa.
 * Compatible con:
 * - Compilación a través de Nest CLI (`nest build --webpack`)
 * - Compilación directa vía Webpack CLI (`webpack --config webpack.config.js`)
 */
module.exports = function (opcionesNest, webpackInstancia) {
  const wp = webpackInstancia || webpack;

  // Lista de controladores opcionales de TypeORM para ignorar si no están instalados
  const pluginIgnorarDriversOpcionales = new wp.IgnorePlugin({
    checkResource(recurso) {
      const controladoresOpcionales = [
        '@sap/hana-client',
        'better-sqlite3',
        'hdb-pool',
        'ioredis',
        'mongodb',
        'mssql',
        'mysql',
        'mysql2',
        'oracledb',
        'react-native-sqlite-storage',
        'redis',
        'sql.js',
        'sqlite3',
        'typeorm-aurora-data-api-driver',
      ];
      if (controladoresOpcionales.includes(recurso)) {
        try {
          require.resolve(recurso);
        } catch {
          return true;
        }
      }
      return false;
    },
  });

  // Si Nest CLI invoca con configuración base
  if (opcionesNest && typeof opcionesNest === 'object') {
    const pluginsExistentes = opcionesNest.plugins || [];
    const externalsExistentes = Array.isArray(opcionesNest.externals)
      ? opcionesNest.externals
      : opcionesNest.externals
      ? [opcionesNest.externals]
      : [];

    return {
      ...opcionesNest,
      entry: opcionesNest.entry || './src/main.ts',
      target: 'node',
      externals: [
        nodeExternals({
          allowlist: [],
        }),
        ...externalsExistentes,
      ],
      plugins: [...pluginsExistentes, pluginIgnorarDriversOpcionales],
      resolve: {
        ...(opcionesNest.resolve || {}),
        extensions: ['.ts', '.tsx', '.js', '.json'],
      },
    };
  }

  // Si es llamado directamente por webpack CLI
  return {
    entry: './src/main.ts',
    target: 'node',
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    externals: [nodeExternals()],
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            },
          },
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.json'],
    },
    plugins: [pluginIgnorarDriversOpcionales],
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'main.js',
    },
  };
};
