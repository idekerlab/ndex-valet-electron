#!/usr/bin/env bash


# Build Script for all 3 platforms
rm -rf ../build

mkdir ../build

# For Mac (Universal)
electron-packager . --platform=darwin --arch=x64 --overwrite --icon=icon256.icns --out=../build
cd ../build/NDEx-Valet-darwin-x64
tar -zcvf ../NDEx-Valet-mac.tar.gz ./NDEx-Valet.app
rm -f ../../ndex-valet/src/main/resources/ndex/NDEx-Valet-mac.tar.gz
cp ../NDEx-Valet-mac.tar.gz ../../ndex-valet/src/main/resources/ndex/
cd -

## For Linux: 32bit
#electron-packager . --platform=linux --arch=ia32 --out=../build
#cd ../build
#tar -zcvf NDEx-Valet-linux32.tar.gz ./NDEx-Valet-linux-ia32
#rm -f ../ndex-valet/src/main/resources/ndex/NDEx-Valet-linux32.tar.gz
#cp NDEx-Valet-linux32.tar.gz ../ndex-valet/src/main/resources/ndex/
#cd -
#
## For Linux: 64bit
#electron-packager . --platform=linux --arch=x64 --out=../build
#cd ../build
#tar -zcvf NDEx-Valet-linux64.tar.gz ./NDEx-Valet-linux-x64
#rm -f ../ndex-valet/src/main/resources/ndex/NDEx-Valet-linux64.tar.gz
#cp NDEx-Valet-linux64.tar.gz ../ndex-valet/src/main/resources/ndex/
#cd -
#
## For Windows: 32bit
#electron-packager . --platform=win32 --arch=ia32 --out=../build
#cd ../build
#mv NDEx-Valet-win32-ia32 NDEx-Valet-win32
#zip -r NDEx-Valet-win32.zip ./NDEx-Valet-win32
#rm -f ../ndex-valet/src/main/resources/ndex/NDEx-Valet-win32.zip
#cp NDEx-Valet-win32.zip ../ndex-valet/src/main/resources/ndex/
#cd -
#
#
## For Windows: 64bit
#electron-packager . --platform=win32 --arch=x64 --out=../build
#cd ../build
#mv NDEx-Valet-win32-x64 NDEx-Valet-win64
#zip -r NDEx-Valet-win64.zip ./NDEx-Valet-win64
#rm -f ../ndex-valet/src/main/resources/ndex/NDEx-Valet-win64.zip
#cp NDEx-Valet-win64.zip ../ndex-valet/src/main/resources/ndex/
#
#cd -
