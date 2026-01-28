cd ~/sites/rival
docker pull ivirsen/rival
docker compose up -d --force-recreate --build $(docker compose ps --services | grep "ladder-")
docker image prune -f
docker exec rival-redis-1 redis-cli FLUSHALL