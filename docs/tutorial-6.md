---
id: tutorial-6
title: Deploying the Production Build
---

## What we will do in this step

As a final step of this tutorial, we will deploy our production build to a Linux server running on an AWS EC2 instance.

Because the main focus of this step is to show you the essence of building and deploying Gourmet SSR project in production environment, we will configure a single server manually to run everything on it.

In a real production though, you would need to consider other general issues such as distributed architecture, security, and DevOps workflow.

## Launching the AWS EC2 instance

Launch an EC2 instance in your preferred region via AWS console. Be sure to choose "Amazon Linux 2 AMI / 64-bit (x86)" as an AMI type. We recommend `t2.micro` or `t3.micro` for the instance type.

For the Security Group, you should open port 22 and 80 to any source IP (`0.0.0.0/0`).

At the final stage of the launch, be sure to choose your key pair so that you can SSH to the EC2 instance.

When the EC2 instance is up, connect to it via a SSH client. You will log in as `ec2-user` which is the default EC2 user account.

Run the following command to update your Linux system with the latest patches.

```text
sudo yum update -y
```

> We assume that you have some basic knowledge about how to launch and manage an EC2 instance via AWS console. Explaining basics about the AWS service is out of scope of this tutorial.

## Installing additional server packages

### Node.js

Amazon Linux doesn't come with Node.js pre-installed nor as an installable package in its default package repo. Use the following commands as described in this [document](https://github.com/nodesource/distributions/blob/master/README.md#rpm) to install Node.js from an alternative repo provided by NodeSource.

```text
curl -sL https://rpm.nodesource.com/setup_10.x | sudo bash -
sudo yum install -y nodejs
```

We also need to install dev tools to build some native npm packages.

```text
sudo yum install -y git gcc-c++ make openssl-devel
```

### PostgreSQL

We will run PostgreSQL server locally in the same server to serve our SQL database needs. The database is configured so that it trusts all local connections without the password-based authentication.

```text
# install PostreSQL
sudo yum install -y posgresql postgresql-server

# initialize PostreSQL database
PGSETUP_INITDB_OPTIONS="-U postgres -E UTF8 -A trust" sudo -E postgresql-setup initdb

# enable & start PostgreSQL service
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

## Configuring directories

### Production app directory

We will install our production app at `/var/app/news-ssr`. For security, we will create a new Linux user account `nodejs`, and run our production app under the account.

```text
# add 'nodejs' group & user
sudo groupadd nodejs -g 494
sudo adduser nodejs -d /tmp -g nodejs -u 496 -s /sbin/no-login -M

# create app directory
sudo -u nodejs mkdir -p /var/app/news-ssr
```

### Working directory

We will clone the GitHub repo of the News App into the working directory at `~/work/news-ssr`. The working directory is needed to build the production output. In your real production setup, this process would be performed in a separate build machine as a part of CI workflow.

```text
mkdir ~/work
cd ~/work
git clone https://github.com/gourmetjs/news-ssr
cd news-ssr
git checkout step6
npm install
```

## Registering custom systemd services

### Installing and enabling

While you are still at the working directory `~/work/news-ssr`, run the following commands.

```text
sudo cp deploy/port-redirect.service /lib/systemd/system
sudo cp deploy/news-ssr.service /lib/systemd/system
```

These will install our two custom services to [systemd](https://en.wikipedia.org/wiki/Systemd) directory.

- `port-redirect.service`: redirect all traffic from port 80 to 3080
- `news-ssr.service`: run the production app at `/var/app/news-ssr/lib/server.js`.

Before proceed, edit the `news-ssr.service` file to chage the value of `NEWS_API_KEY`.

```text
sudo vi /lib/systemd/system/news-ssr.service
```

Find a line looks like the following, and change the example hex string with your own News API key. Save the file, and exit the editor.

```text
# /lib/systemd/system/news-ssr.service
# ...
Environment=NEWS_API_KEY=0123456789abcdef0123456789abcdef
```

Run the following commands to enable the custom services to start at system boot

```text
sudo systemctl enable port-redirect
sudo systemctl enable news-ssr
```

### Starting the services

At this point, our system setup is completed but the app is not running yet. Run the following commands.

```text
npm run deploy
sudo systemctl start port-redirect
sudo systemctl start news-ssr
```

Finally, our production app is running, serving requests received on port 80 - the standard HTTP port. Open your browser and visit the IP address of your EC2 instance. You should see the familiar login screen of our news app.

## Ongoing maintenance

### Updating the app

If you modified your code, and want to update the production app with the changes, follow the steps below.

1. Go to the working directory at `~/work/news-ssr`.
3. Pull the changes from your code repo.
3. Run `npm run deploy`.

The `deploy` script automates most of the update process.

Please note that the server will be down during the update. You should implement the distributed architecture at higher level to deploy updates without disruption (e.g. the rolling update with a load balancer).

### Accessing log

If something goes wrong, looking at the console output of your app can be helpful. You can use the following command for that.

```text
journalctl -u news-ssr
```

## Edited / added files

### package.json

```text
  "scripts": {
    ...
+   "deploy": "bash deploy/deploy.sh"
    ...
```

### deploy/news-ssr.service _(new)_

```text
[Unit]
Description=NewsApp
Documentation=https://github.com/gourmetjs/news-ssr
After=network.target

[Service]
Environment=NODE_ENV=production
Environment=STAGE=prod
Environment=PORT=3080
Environment=PG_CONNECTION_STRING=postgres://postgres@localhost/postgres
Environment=NEWS_API_KEY=0123456789abcdef0123456789abcdef
Type=simple
User=nodejs
ExecStart=/usr/bin/node /var/app/news-ssr/lib/server.js
TimeoutStopSec=30
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### deploy/port-redirect.service _(new)_

```text
[Unit]
Description=Port Redirect
Documentation=https://github.com/gourmetjs/news-ssr
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/sbin/iptables -A PREROUTING -t nat -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 3080
RemainAfterExit=true

[Install]
WantedBy=multi-user.target
```

### deploy/deploy.sh _(new)_

```text
#!/bin/bash -xe

# set PG_CONNECTION_STRING to the local server
export PG_CONNECTION_STRING=postgres://postgres@localhost/postgres

STAGE=prod npm run build          # make the production build
rm -fr .gourmet/prod/info         # remove unnecessary files
STAGE=prod npm run migrate        # run migrations

sudo systemctl stop news-ssr      # stop currently running server
sudo rm -fr /var/app/news-ssr/*   # delete the current deployment

# copy newly built files, and install dependencies in production mode
sudo -u nodejs cp -R *.js *.json lib .gourmet /var/app/news-ssr/
sudo -u nodejs npm install --prefix /var/app/news-ssr --production

sudo systemctl start news-ssr     # restart the server
```

## More about the deployment

### Port redirection

Because our app is running under a unprivileged account `nodejs`, it can't access ports below 1024. As a good practice for security, we use the port redirection instead of running our app under `root`.

The `port-redirect` service configures the system to redirect all traffic from port 80 to port 3080, where our app is listening to in production stage.

### `deploy` script

The `deploy.sh` script will do the following.

1. Set the environment variable `PG_CONNECTION_STRING` to run the migrations.
2. Build the production output with `STAGE=prod npm run build`.
3. Remove the directory `.gourmet/prod/info`. It contains intermediate files that are not needed at runtime.
4. Run Knex migrations with `STAGE=prod npm run migrate`.
5. Stop the production app.
6. Delete all files inside the production directory at `/var/app/news-ssr`.
7. Copy files needed at runtime from the working directory to the production directory.
8. Run `npm install --production` at the production directory.
9. Start the production app.

### Files in the production directory

The `deploy` script copies only a minimal set of files that are required to run the production app.

- `lib/*`
- `knexfile.js`
- `.gourmet/prod/server/*`
- `.gourmet/prod/client/*`
- `package.json`
- `package-lock.json`

In addition to these, packages specified in `package.json:dependencies` are freshly installed under `node_modules`. Note that packages in `package.json:devDependencies` are not installed in production mode (`npm install --production`).

The files in `.gourmet/prod/server/*` are for the server-side rendering. Each page has a corresponding bundle file containing all modules that the page requires.

The files in `.gourmet/prod/client/*` are for the client-side rendering. By default, Gourmet SSR applies "fine" level of granularity of bundling to the production build. It generates multiple smaller bundles compared to the traditional bundling practice which prefers one (or a few) big bundle.

With each small bundle containing only related modules, this bundling algorithm will greatly increase browser's cache performance while taking advantage of multiplexing in [HTTP/2 environment](https://medium.com/@asyncmax/the-right-way-to-bundle-your-assets-for-faster-sites-over-http-2-437c37efe3ff).

Also, as another example of how important the production is to Gourmet SSR, the filenames of the bundles are shortened like `3hGAh9aZ.js` to minimize the size of the host HTML document. By default, the filenames are derived from the source paths, but you can enable a content hash based naming for [long-term caching](https://developers.google.com/web/fundamentals/performance/webpack/use-long-term-caching).

