#!/bin/bash
# Compile the TypeScript file
tsc scripts/business-insights-cron.ts --moduleResolution node --module commonjs --esModuleInterop true --outDir dist

# Run the compiled JavaScript
node dist/business-insights-cron.js
