'use strict'

/**
 * FLEX classroom BLE beacon (server-as-broadcaster).
 *
 * Run on the faculty laptop alongside the Spring backend. The laptop's
 * Bluetooth radio becomes a BLE peripheral and advertises a fixed service
 * UUID + local name. Students' phones (via Web Bluetooth) scan for that
 * service UUID and pair.
 *
 * Usage:
 *   npm install
 *   node broadcast.js                          # default name + UUID
 *   node broadcast.js "FLEX-CS3001-A"          # custom local name
 *   node broadcast.js "FLEX-CS3001-A" "<uuid>" # custom service UUID too
 *
 * macOS: terminal needs Bluetooth access — System Settings →
 *        Privacy & Security → Bluetooth → enable for your terminal app.
 *        First run may pop the permission prompt; grant it.
 */

const bleno = require('@abandonware/bleno')

// 128-bit service UUID (no dashes for bleno API). Change this if you want
// a per-classroom UUID — backend should store the same UUID on the session.
const DEFAULT_SERVICE_UUID = '00fe2c0000000000000000000000c530'

const localName    = process.argv[2] || 'FLEX-NUKED-CLASSROOM'
const serviceUuid  = (process.argv[3] || DEFAULT_SERVICE_UUID).replace(/-/g, '').toLowerCase()

let started = false

bleno.on('stateChange', (state) => {
  console.log(`[ble] adapter state → ${state}`)
  if (state === 'poweredOn') {
    if (started) return
    started = true
    bleno.startAdvertising(localName, [serviceUuid], (err) => {
      if (err) {
        console.error('[ble] startAdvertising failed:', err)
        process.exit(1)
      }
    })
  } else {
    bleno.stopAdvertising()
  }
})

bleno.on('advertisingStart', (err) => {
  if (err) {
    console.error('[ble] advertisingStart error:', err)
    return
  }
  console.log(`[ble] advertising as "${localName}"  service=${serviceUuid}`)
  // Set up a single read-only "session info" characteristic so phones that
  // do a GATT connect get a sensible response. Mostly cosmetic for the demo.
  bleno.setServices([
    new bleno.PrimaryService({
      uuid: serviceUuid,
      characteristics: [
        new bleno.Characteristic({
          uuid: '2a00',
          properties: ['read'],
          value: Buffer.from('FLEX classroom beacon'),
        }),
      ],
    })
  ], (err) => {
    if (err) console.error('[ble] setServices error:', err)
  })
})

bleno.on('advertisingStop', () => console.log('[ble] advertising stopped'))
bleno.on('accept',           (clientAddr) => console.log(`[ble] client connected: ${clientAddr}`))
bleno.on('disconnect',       (clientAddr) => console.log(`[ble] client disconnected: ${clientAddr}`))

const stop = () => {
  console.log('\n[ble] shutting down…')
  bleno.stopAdvertising(() => process.exit(0))
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
