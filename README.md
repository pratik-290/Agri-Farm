# AgriSolar – Smart Irrigation Dashboard (simulated data)
## Run
    npm install
    npm run dev      # open the localhost link
    npm run build    # production build in /dist
## Notes
- Sensor data is SIMULATED in src/sim.js; it applies the same irrigation rules as the ESP32 firmware.
- Thresholds live in src/config.js (keep identical to the Wokwi/ESP32 code).
- Manual pump control is simulated and NOT connected to hardware.
- Predictive maintenance = rule-based anomaly detection (no trained AI model).
- Future scope: CNN disease detection, weather API, cloud DB, real ESP32 data.
