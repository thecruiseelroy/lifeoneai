# Deploy Life One app to Hostinger (FTP)

This tells you how to get your Hostinger FTP credentials and wire them into `gitupdate.bat` so the built app (`dist`) uploads to your `public_html` automatically.

---

## What you need

1. **FTP host** – the server Hostinger gives you for FTP (e.g. `ftp.yourdomain.com` or a server name).
2. **FTP username** – your Hostinger FTP account username.
3. **FTP password** – the password for that FTP account.

All of these come from your Hostinger control panel (hPanel).

---

## How to get the credentials in Hostinger

1. **Log in to Hostinger**  
   Go to [hpanel.hostinger.com](https://hpanel.hostinger.com) and sign in.

2. **Open the Files / FTP section**  
   - In the left menu, open **Files** (or **Advanced** → **File Manager**).  
   - Look for **FTP Accounts** or **FTP** (sometimes under “Advanced” or “Hosting” → your domain).

3. **Find or create an FTP account**  
   - You may see a **Main account** or **Primary FTP** with a username (often your full email or something like `u123456789`).  
   - If you prefer a separate account for deploy: use **Create FTP account** (or **Add FTP account**).  
   - Choose a username (e.g. `deploy`) and a password.  
   - Note the **username** and **password** you set or see.

4. **Get the FTP host**  
   - In the same FTP section you often see **FTP host** or **Server**.  
   - It might look like:
     - `ftp.yourdomain.com` (replace with your actual domain, e.g. `ftp.lifeoneai.com`), or  
     - A hostname like `something.hostingersite.com` or an IP.  
   - Use exactly what Hostinger shows (no `ftp://` prefix, no trailing slash).

5. **Remote folder**  
   - For the main website, files usually go in **`public_html`**.  
   - If your domain’s document root is different (e.g. `public_html/lifeoneai`), use that path for `FTP_REMOTE_DIR` below.

---

## What to put in your batch file

1. **Copy the example file**  
   In the folder that contains `gitupdate.bat` (your Life One repo root), copy:
   - `deploy-env.bat.example`  
   to:
   - `deploy-env.bat`

2. **Edit `deploy-env.bat`**  
   Replace the placeholders with your real values (no quotes unless the value has spaces):

   ```batch
   @echo off
   set FTP_HOST=ftp.lifeoneai.com
   set FTP_USER=u123456789
   set FTP_PASSWORD=your_actual_ftp_password
   REM Optional: if your site is in a subfolder, e.g. public_html/lifeoneai
   REM set FTP_REMOTE_DIR=public_html
   ```

   - **FTP_HOST** = the FTP host from Hostinger (e.g. `ftp.lifeoneai.com` or the hostname they give).  
   - **FTP_USER** = your FTP username.  
   - **FTP_PASSWORD** = your FTP password.  
   - **FTP_REMOTE_DIR** = only if you need a folder other than `public_html` (uncomment and set).

3. **Keep `deploy-env.bat` private**  
   `deploy-env.bat` is in `.gitignore`, so it won’t be committed. Don’t commit it or share it; it contains your password.

---

## Summary checklist

| What            | Where to get it                          |
|-----------------|------------------------------------------|
| **FTP host**    | Hostinger → Files / FTP → “FTP host” or “Server” |
| **FTP username**| Hostinger → FTP Accounts (main or new account)   |
| **FTP password**| The password for that FTP account        |
| **Remote folder** | Usually `public_html` (default in script) |

After you save `deploy-env.bat`, run `gitupdate.bat` as usual. It will build the app and upload `dist` to Hostinger’s `public_html` (or your `FTP_REMOTE_DIR`) before pushing to Git.
