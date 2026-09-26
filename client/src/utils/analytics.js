const SERVER_URL = (import.meta.env.VITE_SERVER_URL || "https://framoji-backend.onrender.com").replace(/\/+$/, "");

/**
 * Returns a transient anonymous session ID stored only in sessionStorage.
 * Does not use persistent tracking cookies or collect personal identification.
 */
function getAnonymousSessionId() {
  try {
    let sid = sessionStorage.getItem("framoji_analytics_sid");
    if (!sid) {
      sid = window.crypto?.randomUUID?.() || `s_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      sessionStorage.setItem("framoji_analytics_sid", sid);
    }
    return sid;
  } catch {
    return "anonymous";
  }
}

/**
 * Sends a privacy-friendly, anonymous analytics event to the backend.
 * Uses navigator.sendBeacon where available for reliable non-blocking delivery.
 */
export function trackEvent(eventName, metadata = {}) {
  try {
    const payload = JSON.stringify({
      event: eventName,
      sessionId: getAnonymousSessionId(),
      metadata,
    });

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      const sent = navigator.sendBeacon(`${SERVER_URL}/api/analytics/event`, blob);
      if (!sent) {
        fetch(`${SERVER_URL}/api/analytics/event`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } else {
      fetch(`${SERVER_URL}/api/analytics/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch (_) {
    // Non-blocking
  }
}
