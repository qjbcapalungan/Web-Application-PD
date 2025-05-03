// Inside both setInterval functions, add this timing check:
const interval = setInterval(() => {
  const now = Date.now();
  if (now - lastUpdateTime >= 60000) { // Ensure exactly 60 seconds have passed
    lastUpdateTime = now;
    setCurrentSensorIndexes(prev => {
      // ... existing index update code ...
    });
  }
}, 1000); // Check every second instead of waiting 60 seconds
