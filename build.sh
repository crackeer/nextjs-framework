#!/bin/sh
if [ ""$APP_ID == "" ]; then
    APP_ID=$(cat APP_ID)
fi


rm -rf  $APP_ID.tar.gz
rm -rf ./build/
yarn install
npm run build
tar czvf $APP_ID.tar.gz *


BASE_PATH=$(pwd)
RELEASE_BASE_PATH=$BASE_PATH/output
rm -rf $RELEASE_BASE_PATH
mkdir -p $RELEASE_BASE_PATH
if [ $? -ne 0 ]; then
    echo "create release directories fail."
    exit -1
fi
cp run.sh $RELEASE_BASE_PATH
cp APP_ID $RELEASE_BASE_PATH
cp $APP_ID.tar.gz $RELEASE_BASE_PATH