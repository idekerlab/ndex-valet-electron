#!/usr/bin/env bash
rm -rf ./NDEx-*

electron-packager . --all

# Mac
cd NDEx-Valet-darwin-x64
tar -zcvf NDEx-Valet.app.tar.gz ./NDEx-Valet.app
rm -f ../../ndex-valet/src/main/resources/ndex/NDEx-Valet.app.tar.gz
cp NDEx-Valet.app.tar.gz ../../ndex-valet/src/main/resources/ndex/

cd ..

echo "Win"
mv NDEx-Valet-win32-x64 NDEx-Valet
zip -r NDEx-Valet.zip ./NDEx-Valet
rm -f ../ndex-valet/src/main/resources/ndex/NDEx-Valet.zip
cp NDEx-Valet.zip ../ndex-valet/src/main/resources/ndex/
