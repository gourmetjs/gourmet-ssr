---
id: tutorial-6
title: Deploying Production Build
---

```text
# Install Node.js
curl -sL https://rpm.nodesource.com/setup_10.x | sudo bash -
sudo yum install nodejs

# Install PostreSQL
sudo yum install posgresql postgresql-server

# Initialize PostreSQL database
PGSETUP_INITDB_OPTIONS="-U postgres -E UTF8 -A trust" sudo -E postgresql-setup initdb

# add 'nodejs' group & user
sudo groupadd nodejs -g 494
sudo adduser nodejs -d /tmp -g nodejs -u 496 -s /sbin/no-login -M

# setup app directory
sudo mkdir -p /var/app/news-ssr
sudo chown nodejs:nodejs /var/app/news-ssr

# setup work directory
mkdir ~/work
cd ~/work
git clone https://github.com/gourmetjs/news-ssr
cd news-ssr
git checkout step6
npm install

# copy system service
sudo cp deploy/port-redirect.service /lib/systemd/system
sudo cp deploy/news-ssr.service /lib/systemd/system

# enable services to start them at system boot
sudo systemctl enable port-redirect
sudo systemctl enable news-ssr
```
