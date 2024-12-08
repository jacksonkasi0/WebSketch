#!/bin/bash

# Update package list
sudo apt-get update

# Install necessary libraries
sudo apt-get install -y \
  libx11-xcb1 \
  libxcb-dri3-0 \
  libxcomposite1 \
  libxrandr2 \
  libxi6 \
  libxcursor1 \
  libxdamage1 \
  libnss3 \
  libxss1 \
  libxtst6 \
  libglib2.0-0 \
  libgbm1 \
  libpango-1.0-0 \
  libasound2 \
  fonts-liberation \
  libxkbcommon0 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libjpeg-dev \
  libpng-dev \
  libexpat1 \
  libxshmfence1 \
  libgtk-3-0 \
  libgdk-pixbuf2.0-0 \
  libxinerama1 \
  libxrender1

# Set Puppeteer's local Chromium executable permissions
CHROMIUM_DIR="/home/gitpod/.nvm/versions/node/v22.11.0/lib/node_modules/html-sketchapp-cli/node_modules/puppeteer/.local-chromium/linux-686378/chrome-linux"

if [ -d "$CHROMIUM_DIR" ]; then
  echo "Setting executable permissions for Chromium..."
  chmod +x "$CHROMIUM_DIR/chrome"
else
  echo "Chromium directory not found at $CHROMIUM_DIR. Make sure Puppeteer is installed correctly."
fi

# Check Chromium installation
if [ -f "$CHROMIUM_DIR/chrome" ]; then
  echo "Chromium setup complete."
else
  echo "Chromium executable not found. Reinstall Puppeteer or check your installation."
fi
