# NUKED — May 7 Demo Runbook

Step-by-step commands you run on demo morning. Four terminals total.

## Pre-flight (do this once, the night before)

```bash
# 1. Install Cloudflare Tunnel (one-time)
brew install cloudflared

# 2. Pull latest code on the demo branch
cd ~/Projects/studentportal
git checkout bluetooth-attendance
git pull
```

## Demo morning — 5 minutes before class

**Terminal 1 — backend + database (Docker):**
```bash
cd ~/Projects/studentportal
docker compose down -v
docker compose up -d --build
```
Wait ~15 seconds. Verify backend is up:
```bash
curl -X POST http://localhost:8090/api/auth/login -H 'Content-Type: application/json' -d '{}'
```
Should print a 403 + JSON body. That means alive.

**Terminal 2 — student portal (Vite on :5173):**
```bash
cd ~/Projects/studentportal
npm install      # only if first time
npm run dev
```
Wait until you see `Local:   http://localhost:5173/`.

**Terminal 3 — staff portal for faculty (Vite on :5175):**
```bash
cd ~/Projects/studentportal/staff-portal
npm install      # only if first time
npm run dev
```
Open `http://localhost:5175` on your laptop. Log in as `zeeshan.rana / password123`.

**Terminal 4 — Cloudflare Tunnel (HTTPS link for students):**
```bash
cloudflared tunnel --url http://localhost:5173
```
Cloudflare prints a URL like `https://attentive-purple-mango.trycloudflare.com`.
**This is the link you share with the class.**

⚠️ Don't kill terminal 4 mid-demo. The URL dies if you do.

## Faculty steps (your laptop)

1. Staff portal → **Attendance** page.
2. Section dropdown → confirm **CS3001 · BSE-243A** (default).
3. Click **Upload Template** → pick `~/Downloads/AttendanceSheet (7).xlsx` → uploaded confirmation.
4. Make sure your phone (or beacon) is broadcasting BLE under a known name (e.g. `Shahzajb's A06`).
5. Click **BLE Attendance**:
   - Topic: e.g. "Iterative Models"
   - Duration: 30 min
   - BLE device name: the exact name your phone is broadcasting under
6. Click **Open**. Browser asks for Bluetooth + Location — allow both.
7. Active session card appears. Project the screen so students see the link + device name.

## Student steps (their phones)

Tell the class:

> Open this link on Chrome (Android only — Safari doesn't support Bluetooth):
> `https://<your-tunnel-url>`
> Log in with your roll number + password.
> Click **Pair Device**, pick **Shahzajb's A06**, tap **Mark Attendance**.
> Allow Bluetooth + Location when asked.

Student logins are seeded from Sir's roster:
- `24L-3072 / password123` (Suleman)
- `24L-3081 / password123` (Shahzaib)
- All others: roll-no / `student123` (e.g. `24L-3034 / student123` for Hammad, `24L-3018 / student123` for Talha)

## After class

1. Faculty → Attendance page → click **Close & Save** on the active BLE card. Auto-marks unmarked students as Absent.
2. Click **Today's Sheet**. A xlsx downloads named like `attendance-2026-05-07.xlsx`. This is what Sir grades — it's the template he gave you with today's date column appended (`07/05/2026` in row 1 of the next free column starting at F) and `P` / `A` for every student.

## If something goes wrong

| Problem | Fix |
|---|---|
| Tunnel URL doesn't load | Restart `cloudflared` — get a new URL — share again. Old URL is dead. |
| Student says "backend offline" | Their token rotated. F12 → Application → Local Storage → Clear → re-login. |
| Pair Device doesn't show student's BLE | Phone broadcaster must be in foreground + screen unlocked + Bluetooth on. |
| iPhone student can't mark | Apple doesn't ship Web Bluetooth on Safari. They need an Android phone or a laptop with Chrome. |
| Backend rejects mark with "BLE device mismatch" | Student paired with wrong device. Disconnect → re-pair with the device the teacher named. |
| Backend rejects mark with location distance | Student is outside 100 m radius. They need to be physically in the room. |
| Excel download fails | A template wasn't uploaded for that section yet. Upload first, then download. |
| Reset everything (last resort) | Stop everything: `docker compose down -v`. Then re-run from "Demo morning" step 1. **Wipes the DB.** |

## What's tested + working

- Backend healthcheck on `:8090`
- Excel template upload + filled-sheet download
- Cloudflare-tunnel student access
- Mobile-responsive Login + Attendance pages
- BLE strict device-name match + geolocation gate (100 m radius)
- Concurrent student pairing (multiple students can pair the same advertiser)
- View / Edit past sessions with per-session Excel export
