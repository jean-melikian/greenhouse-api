#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MONGO_DIR="${DIR}/mongodb"
MONGO_PORT=27017

if [ ! -d "${MONGO_DIR}" ]; then
  # Control will enter here if $DIRECTORY doesn't exist.
  echo "${MONGO_DIR} doesn't exist. It will now be created."
  mkdir ${MONGO_DIR}
else
	echo "${MONGO_DIR} already exists. MongoDB will now be launched !"
fi

echo "Launching MongoDB on port ${MONGO_PORT}..."
mongod --dbpath ${MONGO_DIR} --port ${MONGO_PORT}