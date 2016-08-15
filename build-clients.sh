#!/usr/bin/env bash

cd ./external-modules/CyFramework/
npm update && npm install
npm run build
cp build/CyFramework.js ../../webapp/ndex-login/CyFramework/
cp build/CyFramework.js ../../webapp/ndex/CyFramework/
cp build/CyFramework.js ../../webapp/ndex-save/CyFramework/
cd -

cd ./external-modules/NDExStore/
npm update && npm install
npm run build
cp build/NDExStore.js ../../webapp/ndex-login/NDExStore/
cp build/NDExStore.js ../../webapp/ndex/NDExStore/
cp build/NDExStore.js ../../webapp/ndex-save/NDExStore/
cd -

cd ./external-modules/NDExLogin/
npm update && npm install
npm run build
cp build/NDExLogin.js ../../webapp/ndex-login/NDExLogin/
cd -

cd ./external-modules/NDExValet/
npm update && npm install
npm run build
cp build/NDExValet.js ../../webapp/ndex/NDExValet/
cd -

cd ./external-modules/NDExSave/
npm update && npm install
npm run build
cp build/NDExSave.js ../../webapp/ndex-save/NDExSave/
cd -
