VERSION=$( node -e "console.log(require('./package.json').version)" )
echo version: ${VERSION}

echo build...
REACT_APP_SERVER_URL="" npm run build

echo Build docker image...
docker build . -t paolini/dm-manager:$VERSION

echo Tag docker image...
docker tag paolini/dm-manager:$VERSION paolini/dm-manager:latest
docker tag paolini/dm-manager:$VERSION registry.cs.dm.unipi.it/dm/dm-manager:$VERSION
docker tag paolini/dm-manager:$VERSION registry.cs.dm.unipi.it/dm/dm-manager:latest

echo Push docker image...
docker push paolini/dm-manager
docker push paolini/dm-manager:$VERSION
docker push registry.cs.dm.unipi.it/dm/dm-manager:$VERSION
docker push registry.cs.dm.unipi.it/dm/dm-manager
