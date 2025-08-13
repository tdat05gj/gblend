#!/bin/bash

# Build script for Vercel deployment
echo "Installing dependencies..."
cd frontend
npm install

echo "Building frontend..."
npm run build

echo "Build completed successfully!"
