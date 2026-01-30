/**
 * Upload life-one-app/dist to Hostinger public_html via FTP.
 * Set env vars: FTP_HOST, FTP_USER, FTP_PASSWORD (optional: FTP_REMOTE_DIR, default public_html).
 * Run from repo root: node scripts/deploy-hostinger.js
 */
import { Client } from 'basic-ftp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const localDir = path.join(__dirname, '..', 'dist')
const remoteDir = process.env.FTP_REMOTE_DIR || 'public_html'

let host = (process.env.FTP_HOST || process.env.HOSTINGER_FTP_HOST || '').trim()
if (host.startsWith('ftp://')) host = host.slice(6)
if (host.startsWith('ftps://')) host = host.slice(7)
host = host.replace(/\/.*$/, '') // remove any path
const user = process.env.FTP_USER || process.env.HOSTINGER_FTP_USER
const password = process.env.FTP_PASSWORD || process.env.HOSTINGER_FTP_PASSWORD

if (!host || !user || !password) {
  console.error('Set FTP_HOST, FTP_USER, FTP_PASSWORD (or HOSTINGER_FTP_*) and try again.')
  process.exit(1)
}

const client = new Client(60_000)

const useSecure = process.env.FTP_SECURE !== 'false'
// Hostinger FTP uses a shared cert (*.hstgr.io), so hostname verification fails for ftp.yourdomain.com
const secureOptions = useSecure ? { rejectUnauthorized: false } : undefined

try {
  console.log('Connecting to', host, '...')
  await client.access({
    host,
    user,
    password,
    secure: useSecure,
    ...(secureOptions && { secureOptions }),
  })
  console.log('Uploading dist to', remoteDir, '...')
  await client.uploadFromDir(localDir, remoteDir)
  console.log('Done. Site updated.')
} catch (err) {
  console.error('Deploy failed:', err.message)
  if (/Hostname\/IP does not match certificate|altnames/.test(err.message)) {
    console.error('')
    console.error('Hostinger FTP uses a shared cert (*.hstgr.io). This script should use secureOptions to allow it; if you still see this, check DEPLOY-HOSTINGER.md.')
  }
  process.exit(1)
} finally {
  client.close()
}
