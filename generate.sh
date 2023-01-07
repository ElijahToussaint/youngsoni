#!/bin/sh

echo '\033[96mChecking for existing static website directory.\033[39m'
DIR='views/_site'
if [ -d "$DIR" ]
then
   echo '\033[93mStatic website directory already exists.\033[39m'
   echo '\033[93mDeleting current static website directory.\033[39m'
   rm -vfr $DIR
   echo '\033[92mCurrent static website directory successfully deleted.\033[39m'
fi
echo '\033[96mGenerating new static website.\033[39m'
node src/scripts/generate.js
echo '\033[96mCopying public static files.\033[39m'
cp -vfr public $DIR
echo '\033[96mCopying bootstrap files.\033[39m'
cp -vfr node_modules/bootstrap $DIR
echo '\033[96mCopying fork-awesome files.\033[39m'
cp -vfr node_modules/fork-awesome $DIR
echo '\033[96mCopying crypto-icons files.\033[39m'
cp -vfr node_modules/crypto-icons $DIR
echo '\033[96mCopying jquery files.\033[39m'
cp -vfr node_modules/jquery $DIR
echo '\033[92mStatic website successfully generated.\033[39m'