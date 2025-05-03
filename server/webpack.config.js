module.exports = {
  // ...existing webpack config if any...
  
  module: {
    rules: [
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false
        }
      }
    ]
  },
  
  ignoreWarnings: [
    /Failed to parse source map/,
    {
      module: /@mediapipe/
    }
  ]
};
