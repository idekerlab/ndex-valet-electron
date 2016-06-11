#!/usr/bin/env bash
electron-packager . --platform=darwin --arch=x64  --overwrite --icon=icon256.icns
cd NDEx-Valet-darwin-x64
tar -zcvf NDEx-Valet.app.tar.gz ./NDEx-Valet.app
rm -f ../../ndex-valet/src/main/resources/ndex/NDEx-Valet.app.tar.gz
cp NDEx-Valet.app.tar.gz ../../ndex-valet/src/main/resources/ndex/
