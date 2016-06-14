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

# For Linux: 32bit
rm -rf ./NDEx-*
electron-packager . --platform=linux --arch=ia32
tar -zcvf NDEx-Valet-linux32.tar.gz ./NDEx-Valet-linux-ia32
rm -f ../ndex-valet/src/main/resources/ndex/NDEx-Valet-linux32.tar.gz
cp NDEx-Valet-linux32.tar.gz ../ndex-valet/src/main/resources/ndex/

# For Linux: 64bit
rm -rf ./NDEx-*
electron-packager . --platform=linux --arch=x64
tar -zcvf NDEx-Valet-linux64.tar.gz ./NDEx-Valet-linux-x64
rm -f ../ndex-valet/src/main/resources/ndex/NDEx-Valet-linux64.tar.gz
cp NDEx-Valet-linux64.tar.gz ../ndex-valet/src/main/resources/ndex/



# For Windows: 32bit
rm -rf ./NDEx-*
electron-packager . --platform=win32 --arch=ia32
mv NDEx-Valet-win32-ia32 NDEx-Valet-win32
zip -r NDEx-Valet-win32.zip ./NDEx-Valet-win32
rm -f ../ndex-valet/src/main/resources/ndex/NDEx-Valet-win32.zip
cp NDEx-Valet-win32.zip ../ndex-valet/src/main/resources/ndex/

# For Windows: 64bit
rm -rf ./NDEx-*
electron-packager . --platform=win32 --arch=x64
mv NDEx-Valet-win32-x64 NDEx-Valet-win64
zip -r NDEx-Valet-win64.zip ./NDEx-Valet-win64
rm -f ../ndex-valet/src/main/resources/ndex/NDEx-Valet-win64.zip
cp NDEx-Valet-win64.zip ../ndex-valet/src/main/resources/ndex/

# Cleanup
rm -rf ./NDEx-*
