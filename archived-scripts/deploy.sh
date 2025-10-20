#!/bin/bash

# Build for web
echo "Building for web..."
npx expo export --platform web --clear

# Check if dist exists
if [ ! -d "dist" ]; then
    echo "Build failed - dist directory not found"
    exit 1
fi

# Deploy to surge
echo "Deploying to surge..."
DOMAIN="cupido-reflection-$(date +%s).surge.sh"
cd dist
surge . $DOMAIN

echo "Deployed to: https://$DOMAIN"