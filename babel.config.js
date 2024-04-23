module.exports = {
  presets: [
    [
      // '@babel/preset-env',
      '@vue/cli-plugin-babel/preset',
      {
        useBuiltIns: 'usage',
        shippedProposals: true,
      },
    ],
  ],
  // plugins: ['@babel/plugin-transform-modules-commonjs'],
};
