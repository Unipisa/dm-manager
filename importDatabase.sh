#!/bin/sh

set -e

# you need credentials to login as the following user:
REMOTE_USERNAME="root"
REMOTE_HOSTNAME="delta.cs.dm.unipi.it"

echo connecting to ${REMOTE_USERNAME}@${REMOTE_HOSTNAME}

for collection in roomlabels tokens users visits ; do 
    echo "* importing ${collection}..."
    ssh ${REMOTE_USERNAME}@${REMOTE_HOSTNAME} docker exec dm-manager_mongodb_1 mongoexport -d dm-manager -c "${collection}" | sudo docker exec -i dm-manager_mongodb_1 mongoimport -d dm-manager -c "${collection}"
done
