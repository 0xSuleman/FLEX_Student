# FLEX BLE Broadcaster

Standalone Node.js script that turns the **faculty laptop** into a Bluetooth Low Energy peripheral. The Spring backend itself can't broadcast (Java has no BLE peripheral library that works cross-platform), so this companion process does it.

This matches the architecture in the NUKED SRS § B.3 (BLE Attendance Flow): server-side broadcaster, students scan and pair.

## Why `@abandonware/bleno`

Original `bleno` is unmaintained since 2018 and won't build on modern macOS / Node 18+. The community fork patches the native build, otherwise the API is identical.

## Setup (one-time)

```bash
cd ble-broadcaster
npm install
```

On macOS first run, the system will ask for Bluetooth permission for your terminal app. Grant it, or pre-add it manually:
**System Settings → Privacy & Security → Bluetooth → enable for Terminal / iTerm**.

If install fails with native build errors, check Node version:

```bash
node --version   # need 16, 18, or 20 — NOT 21+
```

## Run

```bash
# Default — name "FLEX-NUKED-CLASSROOM"
npm run broadcast

# Custom name (matches what teacher enters in the FLEX portal)
node broadcast.js "FLEX-CS3001-A"

# Custom name + service UUID
node broadcast.js "FLEX-CS3001-A" "12345678-1234-1234-1234-123456789abc"
```

You should see:

```
[ble] adapter state → poweredOn
[ble] advertising as "FLEX-CS3001-A"  service=12345678123412341234123456789abc
```

The laptop is now broadcasting. Verify with any BLE scanner app (nRF Connect, LightBlue) — your laptop will appear under the name you set.

## Stop

`Ctrl+C` in the terminal. The script unregisters the advertisement cleanly.

## Notes

- Script must keep running for as long as the BLE session is open. Don't close the terminal mid-class.
- Bleno blocks while powered, so **keep the laptop awake**: `caffeinate -d -i node broadcast.js` if you want to override sleep.
- This is **separate** from the backend. Run both: `docker compose up -d` (backend) + `npm run broadcast` (this script).
- For the May 7 demo, `bluetooth-attendance` branch uses the phone-broadcaster path (faculty's phone runs nRF Connect / LightBlue). This `bleno-broadcaster` branch is an alternative where the laptop itself broadcasts. Both exist; pick whichever works on the day.
