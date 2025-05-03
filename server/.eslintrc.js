module.exports = {
  // ...existing eslint config if any...
  
  rules: {
    'source-map-loader/no-missing-source-map': 'off'
  },
  
  ignorePatterns: [
    'node_modules/@mediapipe/**/*'
  ]
};
