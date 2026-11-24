// SHARED "CONTRACT" – keep identical to the ESP32 / Wokwi code.
export const CFG = {
  start: 30,      // % moisture: pump ON below this
  stop: 45,       // % moisture: pump OFF at/above this (hysteresis)
  solarWarn: 10,  // V: low-solar warning below this
  maxRun: 60,     // seconds: max continuous pump runtime
  tick: 2000,     // ms between simulated readings
  hist: 40,       // points kept for charts
}
