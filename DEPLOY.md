# Deploying Recipe Collector (VPS, plain Node — no Docker)

The app runs directly on the VPS as a Node process managed by **systemd**. All data (users, recipes, bookmarks, messages and uploaded photos) is in **one SQLite file**, so the main thing to protect is that file.

## 1. One-time server setup

```bash
# Node 22+ (better-sqlite3 13 requires it), e.g. via NodeSource:
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs git

# Service user and folders
useradd --system --create-home --shell /usr/sbin/nologin recipe
mkdir -p /opt/recipe-collector /var/lib/recipe-collector /var/backups/recipe-collector
chown recipe:recipe /opt/recipe-collector /var/lib/recipe-collector /var/backups/recipe-collector

# Code
sudo -u recipe git clone https://github.com/ameetj85/recipe-collector.git /opt/recipe-collector
```

Put the production `.env` in `/opt/recipe-collector/.env` (copy it over with `scp` or an SFTP client such as FileZilla: https://www.inmotionhosting.com/support/website/ftp/connecting-scp-sftp/). Start from `.env.example`, and in particular set:

```
SQLITE_PATH="/var/lib/recipe-collector/recipes.db"   # outside the code folder, so deploys never touch it
NEXTAUTH_URL="https://<your-domain>"
NEXTAUTH_URL_INTERNAL="http://localhost:9000"
NEXT_PUBLIC_DOMAIN="https://<your-domain>"
```

The Google OAuth client must list `https://<your-domain>/api/auth/callback/google` as an authorized redirect URI. DNS records (Hivelocity): https://www.hivelocity.net/kb/how-to-create-dns-records-in-myvelocity/

## 2. Install the database

Copy the migrated database (from `npm run db:migrate` on your machine) to the server. Do this only while the app is stopped:

```bash
scp data/recipes.db root@<vps>:/var/lib/recipe-collector/recipes.db
ssh root@<vps> "chown recipe:recipe /var/lib/recipe-collector/recipes.db && rm -f /var/lib/recipe-collector/recipes.db-wal /var/lib/recipe-collector/recipes.db-shm"
```

(If no file exists, the app creates an empty database on first start.)

## 3. Build and run as a service

```bash
cd /opt/recipe-collector
sudo -u recipe npm ci
sudo -u recipe npm run build
```

`/etc/systemd/system/recipe-collector.service`:

```ini
[Unit]
Description=Recipe Collector (Next.js)
After=network.target

[Service]
User=recipe
WorkingDirectory=/opt/recipe-collector
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable --now recipe-collector
journalctl -u recipe-collector -f        # logs
```

`npm start` listens on port 9000 (it runs `next start -p 9000` and reads `.env` itself). Put a reverse proxy with TLS in front of it, e.g. Caddy (`<your-domain> { reverse_proxy localhost:9000 }`) or nginx.

**Run only one instance** against the database file. Don't use PM2 cluster mode or several services pointing at the same `SQLITE_PATH`.

## 4. Deploying an update

```bash
cd /opt/recipe-collector
sudo -u recipe git pull
sudo -u recipe npm ci
sudo -u recipe npm run build
systemctl restart recipe-collector
```

The database lives in `/var/lib/recipe-collector`, so updates never touch it. Take a backup first if the update changes the schema.

## 5. Backups

`npm run db:backup` takes an online backup (safe while the app is running), checks it with `integrity_check`, and keeps the newest 14.

```bash
# crontab -e   (as root): nightly at 03:00
0 3 * * * cd /opt/recipe-collector && sudo -u recipe npm run db:backup -- --dir /var/backups/recipe-collector --keep 14 >> /var/log/recipe-backup.log 2>&1
```

Copy `/var/backups/recipe-collector` off the server regularly (e.g. `rsync` or `scp` to another machine).

**Restore:** `systemctl stop recipe-collector`, copy a backup over `/var/lib/recipe-collector/recipes.db`, delete any `recipes.db-wal` / `recipes.db-shm` next to it, `chown recipe:recipe` the file, then `systemctl start recipe-collector`.

## 6. Rollback of an app update

`git checkout <previous-commit>`, then `npm ci && npm run build && systemctl restart recipe-collector`. Restore a backup too if the bad version wrote bad data.
