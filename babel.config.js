module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['.'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@api': './src/api',
          '@components': './src/components',
          '@database': './src/database',
          '@modules': './src/modules',
          '@navigation': './src/navigation',
          '@screens': './src/screens',
          '@store': './src/store',
          '@types': './src/types',
          '@utils': './src/utils',
          '@constants': './src/constants',
        },
      },
    ],
    'react-native-worklets/plugin',
  ],
};
