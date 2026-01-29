cd ~/sites/rival
docker pull ivirsen/rival:dev
docker compose up -d --force-recreate --build ladder-test
docker image prune -f
docker exec rival-redis-1 redis-cli FLUSHALL