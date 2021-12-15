# NEAR Stats
Welcome to the NEAR Stats Repo.

NEAR Stats is a dashboard to track the growth of apps on the NEAR Platform. The data behind the NEAR Stats Project comes from the [NEAR Analytics](https://github.com/near/near-analytics) Database for aggregated data, and the [NEAR Ecosystem Repo](https://github.com/near/ecosystem) for app data. Alongside the dashboard is an API that provides that data behind all of the NEAR Stats visualizations.
    
Please visit the [API Wiki](../../wiki/API) for API Documentation.
Details of the structure and code for the dashboard can be found in the [Front End Wiki](../../wiki/Front-end).

# Running NEAR Stats
## Environment Variables
Environment variables required for connection to the NEAR Analytics database are required in a ```.env``` file. An example of the required variables are included in the [.env-example](.env-example). This file can be renamed ```.env```, however the credentials should be checked against the [NEAR Analytics](https://github.com/near/near-analytics) Repo.
  
## Running NEAR Stats Locally
NEAR Stats is developed using [Next.js](https://nextjs.org/). To install the dependencies needed for the project, run ```yarn```.
The project can be ran in development mode using ```yarn dev``` or alternatively in production mode with ```yarn build``` followed by ```yarn start```.

## Additional Dependencies
### Redis Cache Server
A Redis Caching Server is highly recommended to improve loadings time and load on the NEAR Analytics Database. Running NEAR Stats without a Redis Caching Server is possible without any additional modification however queries to the NEAR Analytics Database may be blocked during times of high volume. The Redis Caching Server will cache all results for a period of 24 hours.
  
#### Redis Installation Mac
The following terminal commands will install and run a local Redis Server on a Mac. Additional information and instructions for alternative systems can be found on the [Redis Website](https://redis.io/).
  
```
mkdir redis && cd redis
curl -O http://download.redis.io/redis-stable.tar.gz
tar xzvf redis-stable.tar.gz
cd redis-stable
make
make test
sudo make install
redis-server
```

#### Flushing Redis server cache
In the event you would like to clear the cached database results, the following results will flush (reset) the cache. 
```redis-cli FLUSHDB```


# DOCKER
The following steps will build a docker container that will automatically run the NEAR Stats dashboard and Redis server.

## Install Docker
Download [Docker Desktop](https://www.docker.com/products/docker-desktop) and ensure it is open and running to start the docker daemon.

## Docker Build
```docker build -t nearstats .```

## Docker Start
The docker container can be started from Docker Desktop
Run the image and set the local host port to 3000
visit http://localhost:3000 in your browser.

# Contributing

To contribute to NEAR Stats, please see [CONTRIBUTING](CONTRIBUTING.md).

# License

NEAR Stats is distributed under the terms of both the MIT license and the Apache License (Version 2.0).

See [LICENSE-MIT](LICENSE-MIT) and [LICENSE-APACHE](LICENSE-APACHE) for details.