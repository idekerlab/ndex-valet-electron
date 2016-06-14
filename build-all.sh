#!/usr/bin/env bash

# Build Script for all 3 platforms
rm -rf ./NDEx-*

# For Mac (Universal)
electron-packager . --platform=darwin --arch=x64 --overwrite --icon=icon256.icns
cd NDEx-Valet-darwin-x64
tar -zcvf NDEx-Valet-mac.tar.gz ./NDEx-Valet.app
rm -f ../../ndex-valet/src/main/resources/ndex/NDEx-Valet-mac.tar.gz
cp NDEx-Valet-mac.tar.gz ../../ndex-valet/src/main/resources/ndex/

cd ..

# For Linux: 64bit
electron-packager . --platform=linux --arch=x64
tar -zcvf NDEx-Valet-linux.tar.gz ./NDEx-Valet-linux-x64
rm -f ../ndex-valet/src/main/resources/ndex/NDEx-Valet-linux.tar.gz
cp NDEx-Valet-linux.tar.gz ../ndex-valet/src/main/resources/ndex/


# For Windows: 64bit
electron-packager . --platform=win32 --arch=x64
mv NDEx-Valet-win32-x64 NDEx-Valet-win64
zip -r NDEx-Valet-win64.zip ./NDEx-Valet-win64
rm -f ../ndex-valet/src/main/resources/ndex/NDEx-Valet-win64.zip
cp NDEx-Valet-win64.zip ../ndex-valet/src/main/resources/ndex/
