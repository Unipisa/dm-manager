VERSION=$( node -e "console.log(require('./package.json').version)" )
echo version: ${VERSION}

echo build...
REACT_APP_SERVER_URL="" npm run build

echo Build docker image...
docker build . -t paolini/dm-manager:$VERSION

echo Push docker image...
docker tag paolini/dm-manager:$VERSION paolini/dm-manager:latest
docker tag paolini/dm-manager:$VERSION register.cs.dm.unipi.it/dm/dm-manager:$VERSION
docker tag paolini/dm-manager:$VERSION register.cs.dm.unipi.it/dm/dm-manager:latest
