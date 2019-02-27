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

```


export PG_CONNECTION_STRING=postgres://postgres@localhost/postgres