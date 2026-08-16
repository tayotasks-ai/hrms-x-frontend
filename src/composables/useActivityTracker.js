// In-app active-time tracking. This has NO visibility into other apps,
// other browser tabs, or anything outside the HRMS X tab — it only knows
// whether this tab is open, visible, focused, and has recently received
// real mouse/keyboard/scroll/touch input. That's deliberate: it's meant to
// answer "were they actively using HRMS X," not "what were they doing on
// their computer." See backend/controllers/activityController.js for the
// server-side half of this.
const HEARTBEAT_MS = 5 * 60 * 1000;       // how often we consider sending a ping
const IDLE_THRESHOLD_MS = 5 * 60 * 1000;  // no input within this window = idle, don't ping

let lastInputAt = Date.now();
let intervalId = null;
let listenersAttached = false;

const INPUT_EVENTS = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];

const onInput = () => { lastInputAt = Date.now(); };

const attachListeners = () => {
  if (listenersAttached) return;
  INPUT_EVENTS.forEach(evt => window.addEventListener(evt, onInput, { passive: true }));
  listenersAttached = true;
};

const detachListeners = () => {
  if (!listenersAttached) return;
  INPUT_EVENTS.forEach(evt => window.removeEventListener(evt, onInput));
  listenersAttached = false;
};

// pingFn: the API call to fire on each accepted heartbeat (typically
// useApi().pingActivity). Kept as an argument rather than importing useApi
// directly so this composable has no knowledge of auth/session plumbing.
export function useActivityTracker(pingFn) {
  const start = () => {
    if (intervalId) return; // already running
    lastInputAt = Date.now();
    attachListeners();
    intervalId = setInterval(() => {
      const recentlyActive = Date.now() - lastInputAt < IDLE_THRESHOLD_MS;
      const tabVisible = document.visibilityState === 'visible' && document.hasFocus();
      if (recentlyActive && tabVisible) {
        // Silent background heartbeat — never surface a failure to the user.
        Promise.resolve(pingFn()).catch(() => {});
      }
    }, HEARTBEAT_MS);
  };

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    detachListeners();
  };

  return { start, stop };
}
