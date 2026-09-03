import { useRef, useState, useEffect, useCallback } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, Check, Users, Download, RefreshCw,
  Share2, AlertCircle, ArrowRight,
  Mic, MicOff, Video, VideoOff, QrCode, X,
  Image as ImageIcon,
  Home, ExternalLink, Sparkles, FlipHorizontal,
} from "lucide-react";
import socket from "../socket";

import Countdown from "../components/Countdown";
import PhotoPreview from "../components/PhotoPreview";
import PhotoReview from "../components/PhotoReview";
import Photostrip from "../components/Photostrip";
import FilterSelector from "../components/FilterSelector";
import StickerEditor from "../components/StickerEditor";

const devLog = (...args) => {
  if (import.meta.env.DEV) console.log(...args);
};
const devWarn = (...args) => {
  if (import.meta.env.DEV) console.warn(...args);
};

let sharedAudioCtx = null;
function getAudioCtx() {
  try {
    if (!sharedAudioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx && sharedAudioCtx.state === "suspended") {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch (_) { return null; }
}

function beep(freq = 440, dur = 80) {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur / 1000);
    osc.start(); osc.stop(ctx.currentTime + dur / 1000);
  } catch (_) { }
}

function shutterSound() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.1), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = buf; src.connect(gain); gain.connect(ctx.destination);
    gain.gain.value = 0.22; src.start();
  } catch (_) { }
}

function fireConfetti() {
  try {
    import("canvas-confetti").then(({ default: c }) => {
      c({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      setTimeout(() => c({ particleCount: 50, spread: 110, origin: { y: 0.5 } }), 400);
    });
  } catch (_) { }
}

function captureFromVideo(videoEl, maxDimension = null, isMirrored = false) {
  if (!videoEl) { devWarn("[capture] no videoEl"); return null; }
  if (videoEl.readyState < 2) {
    devWarn("[capture] video not ready — readyState:", videoEl.readyState);
    return null;
  }
  if (videoEl.videoWidth === 0 || videoEl.videoHeight === 0) {
    devWarn("[capture] zero video dimensions");
    return null;
  }
  const sourceW = videoEl.videoWidth;
  const sourceH = videoEl.videoHeight;
  const scale = maxDimension
    ? Math.min(1, maxDimension / Math.max(sourceW, sourceH))
    : 1;
  const w = Math.round(sourceW * scale);
  const h = Math.round(sourceH * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (isMirrored) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(videoEl, 0, 0, w, h);
  const d = canvas.toDataURL("image/jpeg", maxDimension ? 0.86 : 0.92);
  devLog("[capture] ok", w, "x", h, "len:", d.length);
  return d;
}

async function mergeFrames(framesObj, peerOrder = []) {
  if (!framesObj || typeof framesObj !== "object") return null;
  const rawIds = Array.isArray(peerOrder) && peerOrder.length > 0
    ? peerOrder.filter(id => framesObj[id] && typeof framesObj[id] === "string")
    : Object.keys(framesObj).filter(id => typeof framesObj[id] === "string");

  if (!rawIds.length) return null;
  if (rawIds.length === 1) return framesObj[rawIds[0]];

  const loadSingle = (dataUrl, id) => new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== "string") return resolve(null);
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => {
      console.warn("[merge] image load failed for peer:", id, e);
      resolve(null);
    };
    img.src = dataUrl;
  });

  const loadedImgs = await Promise.all(rawIds.map(id => loadSingle(framesObj[id], id)));
  const validImgs = loadedImgs.filter(Boolean);

  if (validImgs.length === 0) return null;
  if (validImgs.length === 1) return validImgs[0].src;

  const W = validImgs[0].naturalWidth || validImgs[0].width || 640;
  const H = validImgs[0].naturalHeight || validImgs[0].height || 480;
  const cols = 2;
  const rows = Math.ceil(validImgs.length / cols);
  const canvas = document.createElement("canvas");
  canvas.width = W * cols;
  canvas.height = H * rows;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  validImgs.forEach((img, i) => {
    const x = (i % cols) * W;
    const y = Math.floor(i / cols) * H;
    ctx.drawImage(img, x, y, W, H);
  });

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 2;
  for (let c = 1; c < cols; c++) {
    ctx.beginPath(); ctx.moveTo(c * W, 0); ctx.lineTo(c * W, canvas.height); ctx.stroke();
  }
  for (let r = 1; r < rows; r++) {
    ctx.beginPath(); ctx.moveTo(0, r * H); ctx.lineTo(canvas.width, r * H); ctx.stroke();
  }

  return canvas.toDataURL("image/jpeg", 0.92);
}

function useWebRTC() {
  const peersRef = useRef({});
  const localStreamRef = useRef(null);
  const negotiatingRef = useRef({});
  const iceCandidateQueueRef = useRef({});
  const [remoteStreams, setRemoteStreams] = useState({});

  const setStream = useCallback((stream) => {
    localStreamRef.current = stream;
    Object.entries(peersRef.current).forEach(([peerId, pc]) => {
      if (pc.signalingState === "closed") return;
      const senders = pc.getSenders();
      stream.getTracks().forEach(track => {
        const already = senders.some(s => s.track?.id === track.id);
        if (!already) { pc.addTrack(track, stream); devLog("[rtc] late track to", peerId); }
      });
    });
  }, []);

  const getOrCreate = useCallback((peerId) => {
    if (peersRef.current[peerId]) return peersRef.current[peerId];
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun.services.mozilla.com" },
      ],
    });
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current));
    pc.ontrack = e => {
      devLog("[rtc] REMOTE TRACK from", peerId, e.streams.length, "streams");
      if (e.streams?.[0]) setRemoteStreams(p => ({ ...p, [peerId]: e.streams[0] }));
    };
    pc.onicecandidate = e => {
      if (e.candidate) socket.emit("webrtc-ice", { to: peerId, candidate: e.candidate });
    };
    pc.onconnectionstatechange = () => {
      devLog("[rtc]", pc.connectionState, peerId);
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        delete peersRef.current[peerId]; delete negotiatingRef.current[peerId];
        delete iceCandidateQueueRef.current[peerId];
        setRemoteStreams(p => { const n = { ...p }; delete n[peerId]; return n; });
      }
    };
    pc.onnegotiationneeded = async () => {
      if (negotiatingRef.current[peerId]) { devLog("[rtc] onnegotiationneeded deferred", peerId); return; }
      if (pc.signalingState !== "stable") return;
      try {
        negotiatingRef.current[peerId] = true;
        const offer = await pc.createOffer();
        if (pc.signalingState !== "stable") return;
        await pc.setLocalDescription(offer);
        socket.emit("webrtc-offer", { to: peerId, offer });
      } catch (e) { devWarn("[rtc] onnegotiationneeded error:", e.message); }
      finally { negotiatingRef.current[peerId] = false; }
    };
    peersRef.current[peerId] = pc;
    return pc;
  }, []);

  // Only the participant joining/rejoining a room starts the offer.  Letting
  // both sides offer after a refresh produces WebRTC glare (two local offers),
  // which leaves both cameras stuck on "Connecting…".
  const createOfferForPeer = useCallback(async (peerId) => {
    if (!localStreamRef.current) return false;
    const pc = getOrCreate(peerId);
    if (
      negotiatingRef.current[peerId] ||
      pc.signalingState !== "stable" ||
      pc.remoteDescription ||
      pc.connectionState === "connected"
    ) return false;

    try {
      negotiatingRef.current[peerId] = true;
      const offer = await pc.createOffer();
      if (pc.signalingState !== "stable") return false;
      await pc.setLocalDescription(offer);
      socket.emit("webrtc-offer", { to: peerId, offer });
      return true;
    } catch (e) {
      devWarn("[rtc] offer error:", e.message);
      return false;
    } finally {
      negotiatingRef.current[peerId] = false;
    }
  }, [getOrCreate]);

  useEffect(() => {
    const onPeerJoined = ({ id }) => {
      // The joining peer receives peers-updated and starts the offer. Existing
      // peers wait for that offer, preventing a simultaneous-offer collision.
      devLog("[rtc] peer-joined:", id, "— waiting for joining peer offer");
    };

    const onOffer = async ({ from, offer }) => {
      devLog("[rtc] offer from:", from, "| stream ready:", !!localStreamRef.current);
      const pc = getOrCreate(from);
      try {
        negotiatingRef.current[from] = true;
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const queued = iceCandidateQueueRef.current[from] || [];
        for (const c of queued) try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (_) { }
        delete iceCandidateQueueRef.current[from];
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc-answer", { to: from, answer });
      } catch (e) { devWarn("[rtc] offer error:", e.message); }
      finally { negotiatingRef.current[from] = false; }
    };

    const onAnswer = async ({ from, answer }) => {
      devLog("[rtc] answer from:", from);
      const pc = peersRef.current[from];
      if (!pc || pc.signalingState === "stable") return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        const queued = iceCandidateQueueRef.current[from] || [];
        for (const c of queued) try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (_) { }
        delete iceCandidateQueueRef.current[from];
      } catch (e) { devWarn("[rtc] answer error:", e.message); }
    };

    const onIce = async ({ from, candidate }) => {
      const pc = peersRef.current[from];
      if (!pc || !candidate) return;
      try {
        if (pc.remoteDescription?.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          if (!iceCandidateQueueRef.current[from]) iceCandidateQueueRef.current[from] = [];
          iceCandidateQueueRef.current[from].push(candidate);
          devLog("[rtc] buffering ICE for", from);
        }
      } catch (e) { devWarn("[rtc] addIceCandidate:", e.message); }
    };

    const onPeerLeft = ({ id }) => {
      devLog("[rtc] peer-left:", id);
      peersRef.current[id]?.close(); delete peersRef.current[id];
      delete negotiatingRef.current[id]; delete iceCandidateQueueRef.current[id];
      setRemoteStreams(p => { const n = { ...p }; delete n[id]; return n; });
    };

    socket.on("peer-joined", onPeerJoined);
    socket.on("webrtc-offer", onOffer);
    socket.on("webrtc-answer", onAnswer);
    socket.on("webrtc-ice", onIce);
    socket.on("peer-left", onPeerLeft);
    return () => {
      socket.off("peer-joined", onPeerJoined);
      socket.off("webrtc-offer", onOffer);
      socket.off("webrtc-answer", onAnswer);
      socket.off("webrtc-ice", onIce);
      socket.off("peer-left", onPeerLeft);
    };
  }, [getOrCreate]);

  const cleanupPeers = useCallback(() => {
    Object.values(peersRef.current).forEach(pc => pc.close());
    peersRef.current = {}; negotiatingRef.current = {};
    iceCandidateQueueRef.current = {}; setRemoteStreams({});
  }, []);

  return { remoteStreams, cleanupPeers, setStream, createOfferForPeer };
}

function LocalCameraView({ stream, videoRef, isMirrored = false }) {
  return (
    <video
      ref={(el) => {
        if (videoRef) videoRef.current = el;
        if (el && stream && el.srcObject !== stream) {
          el.srcObject = stream;
          el.play?.().catch(() => {});
        }
      }}
      autoPlay
      playsInline
      muted
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        transform: isMirrored ? "scaleX(-1)" : "none",
        transition: "transform 0.2s ease",
      }}
    />
  );
}

function RemoteVideo({ stream, name }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
      ref.current.play?.().catch(() => {});
    }
  }, [stream]);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#0a0a0a" }}>
      <video ref={ref} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      {name && <div style={{ position: "absolute", bottom: 7, left: 7, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)", borderRadius: 4, padding: "2px 7px", fontSize: 10, fontWeight: 700, color: "#fff" }}>{name}</div>}
    </div>
  );
}

function InvitePanel({ roomId, boothData, peerList }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/room/${roomId}`;
  const copy = () => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const share = () => { if (navigator.share) navigator.share({ title: "Join my Framoji booth!", url: link }).catch(() => { }); else copy(); };
  const isDuo = boothData.modeConfig?.participants === "duo";
  const maxCapacity = boothData.friendCount || (isDuo ? 2 : 1);

  const connectedPeers = peerList.slice(0, maxCapacity);
  const waitingSlots = Math.max(0, maxCapacity - connectedPeers.length);

  return (
    <div className="card" style={{ padding: 18, marginBottom: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 12, display: "flex", alignItems: "center", gap: 6, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-sub)" }}>
        <Users size={11} color="var(--violet-lt)" />
        {boothData.modeConfig?.waitText || "Participants"} ({connectedPeers.length}/{maxCapacity})
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
        {connectedPeers.map((p) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 10px", borderRadius: 8, background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.14)" }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: p.isHost ? "rgba(124,58,237,0.45)" : "rgba(124,58,237,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "var(--mauve)", flexShrink: 0 }}>
              {(p.name?.[0] || "?").toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
                {p.name}{p.isHost && <span style={{ fontSize: 9, color: "var(--violet-lt)", marginLeft: 5, fontWeight: 700 }}>HOST</span>}
              </div>
              <div style={{ fontSize: 10, color: "#86EFAC" }}>Connected</div>
            </div>
          </div>
        ))}
        {Array.from({ length: waitingSlots }).map((_, i) => (
          <div key={`wait-${i}`} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px dashed var(--border)" }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", border: "1px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Users size={11} color="var(--text-sub)" />
            </div>
            <div style={{ fontSize: 12, color: "var(--text-sub)" }}>
              {isDuo ? "Waiting for partner…" : "Waiting for friend…"}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.16)", marginBottom: 9 }}>
        <div style={{ fontSize: 9, color: "var(--violet-lt)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Room code</div>
        <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: "0.14em", color: "var(--mauve)", fontFamily: "monospace" }}>{roomId.toUpperCase()}</div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button className="btn" onClick={copy} style={{ flex: 1, padding: "7px 0", borderRadius: 7, background: "rgba(255,255,255,0.06)", color: "var(--text)", fontSize: 11, gap: 4 }}>
          {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy link</>}
        </button>
        <button className="btn" onClick={share} style={{ flex: 1, padding: "7px 0", borderRadius: 7, background: "rgba(124,58,237,0.13)", color: "var(--mauve)", fontSize: 11, gap: 4 }}>
          <Share2 size={10} /> Share
        </button>
      </div>
    </div>
  );
}

function GuestNameScreen({ boothData, onJoin, localStream, authError }) {
  const isCoupleMode = boothData?.theme === "couple";
  const [name, setName] = useState(isCoupleMode ? (boothData?.participant2 || "") : "");
  const [err, setErr] = useState("");
  const videoRef = useRef(null);

  useEffect(() => {
    if (boothData?.theme === "couple" && boothData?.participant2 && !name) setName(boothData.participant2);
  }, [boothData?.participant2, boothData?.theme]); // eslint-disable-line

  useEffect(() => {
    if (videoRef.current && localStream && videoRef.current.srcObject !== localStream) {
      videoRef.current.srcObject = localStream;
      videoRef.current.play?.().catch(() => {});
    }
  }, [localStream]);
  const submit = () => {
    if (!name.trim()) { setErr("Enter your name to continue."); return; }
    onJoin(name.trim());
  };
  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }} className="aurora-bg">
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", bottom: "-5%", right: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(244,63,94,0.05) 0%, transparent 60%)" }} />
      </div>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 5 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 6 }}>fra<span style={{ color: "var(--violet-lt)" }}>moji</span></div>
          {boothData?.participant1 ? (
            <>
              <h1 className="display" style={{ fontSize: 28, color: "var(--cream)", marginBottom: 8 }}>
                {isCoupleMode ? `${boothData.participant1} is waiting for you` : `Join ${boothData.participant1}'s booth`}
              </h1>
              <p style={{ color: "var(--text-sub)", fontSize: 13, lineHeight: 1.5 }}>
                {isCoupleMode && boothData.participant2 ? `You're joining as ${boothData.participant2}. Change your name below if needed.` : "Enter your name so everyone knows who you are."}
              </p>
            </>
          ) : (
            <>
              <h1 className="display" style={{ fontSize: 28, color: "var(--cream)", marginBottom: 8 }}>You're almost in</h1>
              <p style={{ color: "var(--text-sub)", fontSize: 13 }}>Enter your name before joining.</p>
            </>
          )}
        </div>
        <div className="card" style={{ padding: 20 }}>
          {/* Local camera preview using the existing localStream */}
          <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", borderRadius: 10, overflow: "hidden", background: "#0a0a0a", marginBottom: 16, border: "1px solid var(--border)" }}>
            <video
              ref={(el) => {
                videoRef.current = el;
                if (el && localStream && el.srcObject !== localStream) {
                  el.srcObject = localStream;
                  el.play?.().catch(() => {});
                }
              }}
              autoPlay
              playsInline
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover", display: localStream ? "block" : "none" }}
            />
            {!localStream && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-sub)", fontSize: 12 }}>
                Connecting camera…
              </div>
            )}
            <div style={{ position: "absolute", bottom: 7, left: 7, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 600, color: "#fff" }}>
              Camera preview
            </div>
          </div>

          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-sub)", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>Your name</label>
          <input className="field" placeholder="e.g. Priya" value={name}
            onChange={e => { setName(e.target.value); setErr(""); }}
            onKeyDown={e => e.key === "Enter" && submit()}
            autoFocus style={{ marginBottom: (err || authError) ? 8 : 14 }} />
          {(err || authError) && <p style={{ color: "#F87171", fontSize: 12, marginBottom: 12 }}>{err || authError}</p>}
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="btn btn-primary" style={{ width: "100%", padding: 13, fontSize: 14 }} onClick={submit}>
            Join booth <ArrowRight size={14} />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

function RoomFullScreen({ navigate }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <div style={{ width: 50, height: 50, borderRadius: 13, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
          <Users size={22} color="#FCD34D" />
        </div>
        <h2 className="display" style={{ fontSize: 24, color: "var(--cream)", marginBottom: 10 }}>Booth is full</h2>
        <p style={{ color: "var(--text-sub)", marginBottom: 24, lineHeight: 1.65, fontSize: 14 }}>This booth has reached its maximum capacity. Ask the host to create a new one with more spots.</p>
        <button className="btn btn-primary" style={{ padding: "11px 26px", fontSize: 14, borderRadius: 10 }} onClick={() => navigate("/")}>Back to home</button>
      </div>
    </div>
  );
}

export default function Room() {
  const location = useLocation();
  const { roomId } = useParams();
  const navigate = useNavigate();

  const persisted = (() => {
    try { return JSON.parse(localStorage.getItem(`framoji-room-${roomId}`)) || {}; }
    catch { return {}; }
  })();

  const nav = location.state || {};
  const merged = { ...persisted, ...nav };
  const isSoloMode = !!(merged.isSolo);
  const isHost = isSoloMode ? true : !!(nav.isHost || persisted.isHost);
  const freshHost = !!nav.isHost;
  const initialGuest = nav.guestName || persisted.guestName || "";

  const [guestName, setGuestName] = useState(initialGuest);
  const [nameConfirmed, setNameConfirmed] = useState(isHost || !!initialGuest || isSoloMode);

  const participantIdRef = useRef(
    (() => {
      try {
        const key = `framoji-pid-${roomId}`;
        let pid = localStorage.getItem(key);
        if (!pid) {
          pid = (window.crypto?.randomUUID?.() || ("pid-" + Math.random().toString(36).slice(2)));
          localStorage.setItem(key, pid);
        }
        return pid;
      } catch { return "pid-" + Math.random().toString(36).slice(2); }
    })()
  );

  const tokenRef = useRef(
    (() => {
      try { return localStorage.getItem(`framoji-token-${roomId}`) || ""; }
      catch { return ""; }
    })()
  );

  const [boothData, setBoothData] = useState({
    theme: merged.theme || "friends",
    layout: merged.layout || "classic",
    photoCount: merged.photoCount || 4,
    participant1: merged.participant1 || "",
    participant2: merged.participant2 || "",
    friendCount: merged.friendCount || 2,
    isSolo: merged.isSolo || false,
    modeConfig: merged.modeConfig || null,
  });

  const [localStream, setLocalStream] = useState(null);
  const localVideoRef = useRef(null);
  const hiddenVideoRef = useRef(null);
  const { remoteStreams, cleanupPeers, setStream, createOfferForPeer } = useWebRTC();

  const [peerList, setPeerList] = useState([]);
  const [camError, setCamError] = useState(false);
  const [roomNotFound, setRoomNotFound] = useState(false);
  const [roomFull, setRoomFull] = useState(false);
  const [roomEnded, setRoomEnded] = useState(false);
  const [hostDisconnected, setHostDisconnected] = useState(false);
  const [hostLeft, setHostLeft] = useState(false);
  const [isHostState, setIsHostState] = useState(isHost);

  const [countdown, setCountdown] = useState(null);
  const [flash, setFlash] = useState(false);

  const savedSession = (() => {
    try { return JSON.parse(localStorage.getItem(`framoji-session-${roomId}`)) || {}; }
    catch { return {}; }
  })();
  const [photoIdx, setPhotoIdx] = useState(savedSession.photoIdx || 0);
  const [photos, setPhotos] = useState(savedSession.photos || []);
  const [showReview, setShowReview] = useState(savedSession.showReview || false);
  const [showStrip, setShowStrip] = useState(savedSession.showStrip || false);
  const [capturedPhoto, setCapturedPhoto] = useState(savedSession.capturedPhoto || null);

  const [filter, setFilter] = useState(savedSession.filter || "original");
  const [stickers, setStickers] = useState(savedSession.stickers || []);
  const [selectedStickerId, setSelectedStickerId] = useState(null);
  const [caption, setCaption] = useState(savedSession.caption || "");
  const [downloading, setDown] = useState(false);
  const photostripExportRef = useRef(null);
  const stripIdRef = useRef(
    window.crypto?.randomUUID?.() || ("strip-" + Math.random().toString(36).slice(2) + Date.now().toString(36))
  );
  const [guestAuthError, setGuestAuthError] = useState("");
  const [isMicMuted, setIsMicMuted] = useState(true);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [facingMode, setFacingMode] = useState("user");
  const [currentCamIndex, setCurrentCamIndex] = useState(0);
  const [customQrUrl, setCustomQrUrl] = useState("");
  const [lanIp, setLanIp] = useState("");
  const [qrTab, setQrTab] = useState("strip");
  const [qrSaving, setQrSaving] = useState(false);
  const [copiedQrUrl, setCopiedQrUrl] = useState(false);
  const [isMirrored, setIsMirrored] = useState(false);

  const toggleMic = () => {
    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) {
      navigator.mediaDevices.getUserMedia({ video: false, audio: true }).then(audioStream => {
        const audioTrack = audioStream.getAudioTracks()[0];
        if (audioTrack) {
          localStream.addTrack(audioTrack);
          setStream(localStream);
          setIsMicMuted(false);
        }
      }).catch(err => console.warn("[mic] error enabling mic:", err));
    } else {
      const nextState = !isMicMuted;
      audioTracks.forEach(t => t.enabled = !nextState);
      setStream(localStream);
      setIsMicMuted(nextState);
    }
  };

  const toggleVideo = () => {
    if (!localStream) return;
    const videoTracks = localStream.getVideoTracks();
    const nextState = !isVideoOff;
    videoTracks.forEach(t => t.enabled = !nextState);
    setIsVideoOff(nextState);
  };

  const switchCamera = async () => {
    setCamNotice("");
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(d => d.kind === "videoinput");

      if (videoInputs.length <= 1) {
        setCamNotice("Only 1 camera detected on this device. Flip Camera is designed for smartphones or PCs with multiple cameras.");
        setTimeout(() => setCamNotice(""), 5000);
        return;
      }

      const nextIndex = (currentCamIndex + 1) % videoInputs.length;
      setCurrentCamIndex(nextIndex);
      const targetDevice = videoInputs[nextIndex];

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, deviceId: { exact: targetDevice.deviceId } },
        audio: !isMicMuted,
      });

      if (localStream) {
        localStream.getVideoTracks().forEach(t => t.stop());
      }
      setLocalStream(newStream);
      setStream(newStream);
      if (localVideoRef.current) localVideoRef.current.srcObject = newStream;
    } catch (err) {
      devWarn("[cam] deviceId switch error, trying facingMode:", err);
      const nextMode = facingMode === "user" ? "environment" : "user";
      setFacingMode(nextMode);
      navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: nextMode },
        audio: !isMicMuted,
      }).then(newStream => {
        if (localStream) localStream.getVideoTracks().forEach(t => t.stop());
        setLocalStream(newStream);
        setStream(newStream);
        if (localVideoRef.current) localVideoRef.current.srcObject = newStream;
      }).catch(() => {
        setCamNotice("Secondary camera not available on this device.");
        setTimeout(() => setCamNotice(""), 5000);
      });
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(`framoji-session-${roomId}`, JSON.stringify({
        photos, photoIdx, showReview, showStrip, capturedPhoto, filter, stickers, caption,
      }));
    } catch (_) { }
  }, [photos, photoIdx, showReview, showStrip, capturedPhoto, filter, stickers, caption]); // eslint-disable-line

  const photoIdxRef = useRef(photoIdx);
  const isSoloRef = useRef(boothData.isSolo);
  const photoTargetRef = useRef(boothData.photoCount || 4);
  const isHostRef = useRef(isHostState);
  const guestNameRef = useRef(guestName);
  const doCaptureRef = useRef(null);
  const runCountdownRef = useRef(null);
  const joinedRef = useRef(false);
  const justReconnectedRef = useRef(true); // true on mount so first peers-updated rebuilds WebRTC
  const shouldInitiateOffersRef = useRef(false);
  const mySocketIdRef = useRef(socket.id || "");
  const [mySocketId, setMySocketId] = useState(socket.id || "");

  useEffect(() => { photoIdxRef.current = photoIdx; }, [photoIdx]);
  useEffect(() => { isSoloRef.current = boothData.isSolo; }, [boothData.isSolo]);
  useEffect(() => { photoTargetRef.current = boothData.photoCount || 4; }, [boothData.photoCount]);
  useEffect(() => { isHostRef.current = isHostState; }, [isHostState]);
  useEffect(() => { guestNameRef.current = guestName; }, [guestName]);
  const isMirroredRef = useRef(isMirrored);
  useEffect(() => { isMirroredRef.current = isMirrored; }, [isMirrored]);

  useEffect(() => {
    let stream;
    navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: "user" },
      audio: true,
    })
      .then(s => {
        stream = s;
        s.getAudioTracks().forEach(t => { t.enabled = false; });
        setLocalStream(s); setStream(s);
        if (localVideoRef.current) localVideoRef.current.srcObject = s;
        if (hiddenVideoRef.current) hiddenVideoRef.current.srcObject = s;
        devLog("[cam] ready:", s.getVideoTracks()[0]?.label, "| audio tracks:", s.getAudioTracks().length);
      })
      .catch(err => {
        devWarn("[cam] video+audio failed, trying video only:", err.message);
        navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: "user" },
          audio: false,
        }).then(s => {
          stream = s; setLocalStream(s); setStream(s);
          if (localVideoRef.current) localVideoRef.current.srcObject = s;
          if (hiddenVideoRef.current) hiddenVideoRef.current.srcObject = s;
        }).catch(e => { console.error("[cam] failed completely:", e); setCamError(true); });
      });
    return () => { stream?.getTracks().forEach(t => t.stop()); cleanupPeers(); };
  }, []); // eslint-disable-line

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Dedicated hidden capture video independently bound to localStream
  useEffect(() => {
    const video = hiddenVideoRef.current;
    if (!video || !localStream) return;

    if (video.srcObject !== localStream) {
      video.srcObject = localStream;
    }
    video.play().catch(() => {});
  }, [localStream, nameConfirmed]);



  /* Keep mySocketIdRef in sync — socket.id updates after reconnect.
     justReconnectedRef starts true so the first peers-updated after any page load
     (fresh or refresh) triggers WebRTC initiation for existing peers. */
  useEffect(() => {
    const syncId = () => {
      const id = socket.id || "";
      mySocketIdRef.current = id;
      setMySocketId(id);
    };
    syncId();
    const onConnect = () => {
      justReconnectedRef.current = true; // flag WebRTC rebuild on next peers-updated
      syncId();
    };
    socket.on("connect", onConnect);
    return () => socket.off("connect", onConnect);
  }, []);

  const doCapture = useCallback(async () => {
    const role = isHostRef.current ? "host" : "guest";
    devLog("[CAPTURE] 1 countdown finished]", {
      role,
      roomId,
      socketId: socket.id,
      photoIndex: photoIdxRef.current,
      isHost: isHostRef.current,
      isSolo: isSoloRef.current,
      localStreamActive: !!localStream,
      hiddenVideo: !!hiddenVideoRef.current,
      visibleVideo: !!localVideoRef.current
    });

    devLog("[GUEST CAPTURE] C] doCapture entered", {
      role,
      socketId: socket.id,
      hasHiddenVideo: !!hiddenVideoRef.current,
      hasLocalStream: !!localStream,
      readyState: hiddenVideoRef.current?.readyState,
      videoWidth: hiddenVideoRef.current?.videoWidth,
      videoHeight: hiddenVideoRef.current?.videoHeight
    });

    const video = hiddenVideoRef.current;
    if (!video) {
      devWarn("[capture] hiddenVideoRef is missing for role:", role);
      return;
    }

    if (localStream && video.srcObject !== localStream) {
      devLog("[capture] re-attaching localStream to hidden video for role:", role);
      video.srcObject = localStream;
      video.play().catch(() => {});
    }

    if (video.videoWidth === 0 || video.readyState < 2) {
      devLog("[capture] waiting for hidden video ready...", { readyState: video.readyState, videoWidth: video.videoWidth });
      await new Promise((resolve) => {
        let done = false;
        const check = () => {
          if (!done && video.videoWidth > 0 && video.readyState >= 2) {
            done = true;
            resolve();
          }
        };
        video.addEventListener("loadedmetadata", check, { once: true });
        video.addEventListener("canplay", check, { once: true });
        video.play().catch(() => {});
        const timer = setInterval(() => {
          if (video.videoWidth > 0 && video.readyState >= 2) {
            clearInterval(timer);
            if (!done) { done = true; resolve(); }
          }
        }, 50);
        setTimeout(() => {
          clearInterval(timer);
          if (!done) { done = true; resolve(); }
        }, 1500);
      });
    }

    const frame = captureFromVideo(video, isSoloRef.current ? null : 1280, isMirroredRef.current);

    devLog("[CAPTURE] 2 frame result]", {
      role,
      socketId: socket.id,
      photoIndex: photoIdxRef.current,
      success: !!frame,
      length: frame?.length || 0
    });

    if (frame) {
      devLog("[GUEST CAPTURE] D] capture succeeded", {
        role,
        socketId: socket.id,
        frameLength: frame?.length,
        photoIdx: photoIdxRef.current
      });
    } else {
      console.error("[capture] frame capture failed for role:", role);
      return;
    }

    if (isSoloRef.current) {
      setCapturedPhoto(frame);
      return;
    }

    devLog("[CAPTURE] 3 submit-frame EMIT]", {
      role,
      roomId,
      socketId: socket.id,
      photoIndex: photoIdxRef.current
    });

    devLog("[GUEST CAPTURE] E] emitting submit-frame", {
      role,
      socketId: socket.id,
      socketConnected: socket.connected,
      roomId,
      photoIdx: photoIdxRef.current,
      participantId: participantIdRef.current,
      frameLength: frame?.length
    });

    socket.emit("submit-frame", {
      roomId,
      photoIndex: photoIdxRef.current,
      frame
    });
  }, [roomId, localStream]);
  useEffect(() => { doCaptureRef.current = doCapture; }, [doCapture]);

  const runCountdown = useCallback(() => {
    let count = 5; setCountdown(count);
    const t = setInterval(() => {
      count--;
      if (count > 0) { setCountdown(count); beep(330 + count * 55, 70); }
      else {
        clearInterval(t); setCountdown("📸"); shutterSound(); setFlash(true);
        setTimeout(() => {
          setFlash(false);
          setCountdown(null);
          devLog("[GUEST CAPTURE] B] about to capture", {
            role: isHostRef.current ? "host" : "guest",
            socketId: socket.id,
            roomId,
            photoIdx: photoIdxRef.current
          });
          doCaptureRef.current?.();
        }, 550);
      }
    }, 1000);
  }, [roomId]);
  useEffect(() => { runCountdownRef.current = runCountdown; }, [runCountdown]);

  useEffect(() => {
    socket.on("room-config", (config) => {
      devLog("[socket] room-config isSolo:", config.isSolo, "theme:", config.theme);
      setBoothData(config); isSoloRef.current = config.isSolo;
      try {
        localStorage.setItem(`framoji-room-${roomId}`, JSON.stringify({
          ...config, isHost: isHostRef.current, guestName: guestNameRef.current,
        }));
      } catch (_) { }
    });

    socket.on("peers-updated", (list) => {
      devLog("[socket] peers:", list.map(p => `${p.name}${p.isHost ? " (host)" : ""}`).join(", "));
      setPeerList(list);
      if (list.some(p => p.isHost)) setHostDisconnected(false);
      if (socket.id && !mySocketIdRef.current) {
        mySocketIdRef.current = socket.id;
        setMySocketId(socket.id);
      }

      /* WEBRTC RECONNECT FIX:
         After a page refresh the reconnecting client gets peers-updated with the
         full room list but peer-joined only fires on OTHER peers' screens.
         The reconnecting client never calls getOrCreate() for existing peers
         and WebRTC is never rebuilt → cameras freeze.
         Fix: on the first peers-updated after reconnect, send offers to all existing peers. */
      if (justReconnectedRef.current && list.length > 1) {
        justReconnectedRef.current = false;
        shouldInitiateOffersRef.current = true;
        const myId = socket.id;
        list.forEach((peer) => {
          if (peer.id === myId) return;
          devLog("[rtc] post-reconnect: awaiting local camera before offer to", peer.name);
        });
      } else if (justReconnectedRef.current) {
        justReconnectedRef.current = false;
      }
    });

    socket.on("countdown-started", (data) => {
      const role = isHostRef.current ? "host" : "guest";
      devLog("[GUEST CAPTURE] A] countdown-started", {
        role,
        socketId: socket.id,
        roomId,
        photoIdx: data?.photoIndex ?? photoIdxRef.current,
        isHost: isHostRef.current
      });
      if (data && typeof data.photoIndex === "number") {
        setPhotoIdx(data.photoIndex);
        photoIdxRef.current = data.photoIndex;
      }
      runCountdownRef.current?.();
    });

    socket.on("frames-ready", async (data) => {
      const { photoIndex, frames, peerOrder } = data || {};
      const role = isHostRef.current ? "host" : "guest";
      devLog("[CAPTURE] 7 frames-ready RECEIVED]", {
        role,
        socketId: socket.id,
        photoIndex,
        peerOrder,
        frameIds: Object.keys(frames || {})
      });
      devLog("[GUEST CAPTURE] F] frames-ready received", {
        role,
        socketId: socket.id,
        photoIndex,
        frameIds: Object.keys(frames || {})
      });
      try {
        const merged = await mergeFrames(frames, peerOrder);
        devLog("[CAPTURE] 8 merge result]", {
          role,
          success: !!merged,
          length: merged?.length || 0
        });
        if (merged) {
          setCapturedPhoto(merged);
        } else {
          console.error("[merge] merge result is null");
        }
      } catch (e) {
        console.error("[merge] error:", e.message);
      }
    });

    socket.on("photo-accepted", ({ photoIndex, photo }) => {
      devLog("[socket] photo-accepted at:", photoIndex);
      if (photo) {
        setPhotos(prev => {
          const next = [...prev];
          next[photoIndex] = photo;
          const target = photoTargetRef.current;
          if (next.filter(Boolean).length >= target) {
            setShowReview(true);
          }
          return next;
        });
      }
      setPhotoIdx(photoIndex + 1); photoIdxRef.current = photoIndex + 1; setCapturedPhoto(null);
    });

    socket.on("photo-retake", ({ photoIndex }) => {
      devLog("[socket] photo-retake, sync index to:", photoIndex);
      setCapturedPhoto(null); setPhotoIdx(photoIndex); photoIdxRef.current = photoIndex;
      setPhotos(prev => {
        const next = [...prev];
        next[photoIndex] = undefined;
        return next;
      });
      setShowReview(false);
    });

    socket.on("room-sync-state", ({ acceptedPhotos, photoIdx: serverIdx, phase }) => {
      devLog("[socket] room-sync-state | accepted:", acceptedPhotos?.length, "serverIdx:", serverIdx, "phase:", phase);
      let totalAccepted = 0;
      if (acceptedPhotos && acceptedPhotos.length > 0) {
        setPhotos(prev => {
          const next = [...prev];
          acceptedPhotos.forEach((p, i) => { if (p) next[i] = p; });
          totalAccepted = next.filter(Boolean).length;
          return next;
        });
      }
      if (typeof serverIdx === "number") {
        setPhotoIdx(serverIdx);
        photoIdxRef.current = serverIdx;
      }
      const targetCount = photoTargetRef.current;
      if (totalAccepted >= targetCount || phase === "review" || phase === "strip") {
        if (phase === "strip") {
          setShowReview(false);
          setShowStrip(true);
        } else {
          setShowReview(true);
          setShowStrip(false);
        }
      }
    });

    socket.on("room-phase", (phase) => {
      if (phase === "strip") { setShowReview(false); setShowStrip(true); }
      else if (phase === "review") { setShowReview(true); setShowStrip(false); }
    });

    socket.on("host-confirmed", () => {
      devLog("[socket] host-confirmed");
      setIsHostState(true); isHostRef.current = true;
    });

    socket.on("host-transferred", () => {
      devLog("[socket] I am now host");
      setIsHostState(true); isHostRef.current = true;
      try {
        const s = JSON.parse(localStorage.getItem(`framoji-room-${roomId}`) || "{}");
        localStorage.setItem(`framoji-room-${roomId}`, JSON.stringify({ ...s, isHost: true }));
      } catch (_) { }
    });

    socket.on("host-disconnected", () => setHostDisconnected(true));
    socket.on("host-left", () => {
      setHostDisconnected(false);
      setHostLeft(true);
    });
    socket.on("room-ended", () => setRoomEnded(true));
    socket.on("room-not-found", () => setRoomNotFound(true));
    socket.on("host-token", (token) => {
      tokenRef.current = token;
      try { localStorage.setItem(`framoji-token-${roomId}`, token); } catch (_) {}
    });

    socket.on("guest-token", (token) => {
      tokenRef.current = token;
      try { localStorage.setItem(`framoji-token-${roomId}`, token); } catch (_) {}
    });

    socket.on("host-auth-failed", () => {
      devWarn("[socket] host auth failed — invalid host token");
      joinedRef.current = false;
      setIsHostState(false);
      isHostRef.current = false;
    });

    socket.on("guest-auth-failed", (data) => {
      devWarn("[socket] guest auth failed — invalid or expired token");
      joinedRef.current = false;
      tokenRef.current = "";
      try { localStorage.removeItem(`framoji-token-${roomId}`); } catch (_) {}
      setNameConfirmed(false);
      setGuestName("");
      guestNameRef.current = "";
      setGuestAuthError(data?.message || "Your previous session expired. Please join the booth again.");
    });

    socket.on("name-taken", () => {
      joinedRef.current = false;
      setNameConfirmed(false);
      setGuestName("");
      guestNameRef.current = "";
    });

    socket.on("room-full", () => {
      joinedRef.current = false;
      setRoomFull(true);
    });

    return () => {
      socket.off("room-config"); socket.off("peers-updated"); socket.off("countdown-started");
      socket.off("frames-ready"); socket.off("photo-accepted"); socket.off("photo-retake");
      socket.off("room-phase"); socket.off("host-confirmed"); socket.off("host-transferred");
      socket.off("host-disconnected"); socket.off("host-left"); socket.off("room-ended"); socket.off("room-not-found");
      socket.off("room-full"); socket.off("name-taken");
      socket.off("guest-auth-failed"); socket.off("host-token"); socket.off("guest-token"); socket.off("host-auth-failed");
    };
  }, []); // eslint-disable-line

  // A joining/reconnecting participant owns offer creation. This waits for the
  // camera stream, so the first SDP always includes local video tracks.
  useEffect(() => {
    if (isSoloMode || !localStream || !socket.connected || !shouldInitiateOffersRef.current) return;
    shouldInitiateOffersRef.current = false;
    const myId = socket.id;
    peerList.forEach((peer) => {
      if (peer.id !== myId) createOfferForPeer(peer.id);
    });
  }, [isSoloMode, localStream, peerList, createOfferForPeer]);

  const doConnect = useCallback((nameOverride) => {
    if (joinedRef.current) { devLog("[socket] already connected — skip"); return; }
    joinedRef.current = true;
    const name = isHost
      ? (merged.participant1 || "Host")
      : (nameOverride || guestNameRef.current || "Guest");
    const pid = participantIdRef.current;
    const token = tokenRef.current || (() => {
      try { return localStorage.getItem(`framoji-token-${roomId}`); } catch (_) { return null; }
    })();
    if (import.meta.env.DEV) {
      console.log(`[socket] connect-room "${name}" pid:${pid.slice(0, 8)} isHost:${isHost} hasToken:${!!token}`);
    }
    socket.emit("connect-room", {
      roomId,
      name,
      participantId: pid,
      isHost,
      rejoinToken: token,
      config: (isHost && freshHost) ? (nav.config || merged) : undefined,
    });
  }, [roomId, isHost, freshHost]); // eslint-disable-line

  useEffect(() => {
    if (!isHost && !nameConfirmed) return;
    if (socket.connected) { doConnect(); }
    else { socket.once("connect", () => doConnect()); }
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!isHost && nameConfirmed && !joinedRef.current) {
      if (socket.connected) { doConnect(guestName); }
      else { socket.once("connect", () => doConnect(guestName)); }
    }
  }, [nameConfirmed]); // eslint-disable-line

  useEffect(() => {
    const onReconnect = () => {
      devLog("[socket] reconnected — cleaning up stale RTC peers, then re-joining");
      cleanupPeers();
      joinedRef.current = false;
      justReconnectedRef.current = true;
      mySocketIdRef.current = socket.id || "";
      setMySocketId(socket.id || "");
      if (isHostRef.current || nameConfirmed) {
        const name = isHostRef.current
          ? (merged.participant1 || "Host")
          : (guestNameRef.current || "Guest");
        doConnect(name);
      }
    };
    socket.on("connect", onReconnect);
    return () => socket.off("connect", onReconnect);
  }, []); // eslint-disable-line

  const startShot = () => {
    if (isSoloRef.current) { runCountdown(); return; }
    if (isHostRef.current) socket.emit("start-countdown", roomId);
  };

  const acceptPhoto = () => {
    const currentIdx = photoIdxRef.current;
    const savedPhoto = capturedPhoto;
    const updated = [...photos];
    updated[currentIdx] = savedPhoto;
    setPhotos(updated);
    setCapturedPhoto(null);
    socket.emit("photo-accepted", { roomId, photoIndex: currentIdx, photo: savedPhoto });
    const targetCount = boothData.photoCount || 4;
    if (updated.filter(Boolean).length >= targetCount) {
      setShowReview(true);
      if (!isSolo) socket.emit("set-phase", { roomId, phase: "review" });
    } else {
      const next = updated.filter(Boolean).length;
      setPhotoIdx(next);
      photoIdxRef.current = next;
    }
  };

  useEffect(() => {
    const targetCount = boothData.photoCount || 4;
    const count = photos.filter(Boolean).length;
    if (count >= targetCount && !showStrip) {
      setShowReview(true);
    }
  }, [photos, boothData.photoCount, showStrip]);

  const onStripDone = () => {
    setShowReview(false); setShowStrip(true); fireConfetti();
    if (!boothData.isSolo) socket.emit("set-phase", { roomId, phase: "strip" });
  };

  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);

  const copyImageToClipboard = async () => {
    setSelectedStickerId(null);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const scale = window.innerWidth < 600 ? 2 : 3;
      const c = await html2canvas(el, { useCORS: true, scale, backgroundColor: null });
      c.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ [blob.type]: blob })
          ]);
          setCopiedImage(true);
          setTimeout(() => setCopiedImage(false), 2500);
        } catch (_) {
          navigator.clipboard.writeText(window.location.href);
          setCopiedImage(true);
          setTimeout(() => setCopiedImage(false), 2500);
        }
      });
    } catch (err) {
      console.error("[clipboard] copy failed:", err);
    }
  };

  const SERVER_URL = import.meta.env.VITE_SERVER_URL || "https://framoji-backend.onrender.com";

  const allPeerNames = peerList.map(p => p.name).filter(Boolean);
  const stripNames = allPeerNames.length > 0 ? allPeerNames.join(" · ") : boothData.participant1;

  // Fetch local machine's LAN IP only in development when testing on localhost
  useEffect(() => {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      fetch(`${SERVER_URL}/api/network-info`)
        .then(res => res.json())
        .then(data => {
          if (data?.localIp && data.localIp !== "localhost") {
            setLanIp(data.localIp);
          }
        })
        .catch(() => {});
    }
  }, [SERVER_URL]);

  const savePhotostripToCloudAndLocal = async () => {
    try {
      const { default: html2canvas } = await import("html2canvas");
      const el = photostripExportRef.current || document.getElementById("photostrip-export");
      if (!el) return null;
      const scale = window.innerWidth < 600 ? 2 : 3;
      const c = await html2canvas(el, { useCORS: true, scale, backgroundColor: null });
      const dataUrl = c.toDataURL("image/png");
      const separateStripId = stripIdRef.current;
      let cloudinaryUrl = null;

      try {
        const res = await fetch(`${SERVER_URL}/api/photostrips`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stripId: separateStripId,
            dataUrl,
            theme: boothData.theme,
            layout: boothData.layout,
            names: stripNames,
            caption,
            roomId,
          }),
        });
        if (res.ok) {
          const saved = await res.json();
          if (saved && saved.cloudinaryUrl) {
            cloudinaryUrl = saved.cloudinaryUrl;
          }
        }
      } catch (e) { console.warn("[api] post error:", e); }

      try {
        const history = JSON.parse(localStorage.getItem("framoji-gallery") || "[]");
        const entry = {
          id: separateStripId,
          stripId: separateStripId,
          roomId,
          cloudinaryUrl,
          dataUrl: cloudinaryUrl ? undefined : dataUrl,
          theme: boothData.theme,
          layout: boothData.layout,
          names: stripNames,
          createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        };
        const updated = [entry, ...history.filter(h => h.stripId !== separateStripId && h.roomId !== roomId)].slice(0, 15);
        localStorage.setItem("framoji-gallery", JSON.stringify(updated));
      } catch (err) { console.warn("[gallery] save error:", err); }

      return { dataUrl, cloudinaryUrl, stripId: separateStripId };
    } catch (err) {
      console.warn("[save] photostrip save error:", err);
      return null;
    }
  };

  const openMobileQrModal = async () => {
    setShowQrModal(true);
    setQrSaving(true);
    await savePhotostripToCloudAndLocal();
    setQrSaving(false);
  };

  const downloadStrip = async () => {
    setSelectedStickerId(null);
    setDown(true);
    try {
      const saved = await savePhotostripToCloudAndLocal();
      if (saved?.dataUrl) {
        const a = document.createElement("a");
        a.download = `framoji-${roomId}.png`;
        a.href = saved.dataUrl;
        a.click();
      }
    } finally { setDown(false); }
  };

  const photoTarget = boothData.photoCount || 4;
  const validPhotos = photos.filter(Boolean);
  const progress = (validPhotos.length / photoTarget) * 100;
  const isSolo = boothData.isSolo || isSoloMode;
  const isEffectiveHost = isSolo || isHostState;
  const modeLabel = ({ solo: "Solo Session", couple: "Couple Booth", friends: "Friends & Family Booth" })[boothData.theme] || "Session";
  const requiredPeers = isSolo ? 1 : boothData.modeConfig?.participants === "duo" ? 2 : (boothData.friendCount || 2);
  const enoughPeers = isSolo ? true : peerList.length >= requiredPeers;
  const canShoot = isEffectiveHost && enoughPeers;
  const missingCount = isSolo ? 0 : Math.max(0, requiredPeers - peerList.length);
  const waitingFor = isSolo ? null : missingCount > 0
    ? (boothData.modeConfig?.participants === "duo" && boothData.participant2
      ? `Waiting for ${boothData.participant2} to join…`
      : `Waiting for ${missingCount} more ${missingCount === 1 ? "person" : "people"}…`)
    : null;
  const gridCols = isSolo ? 1 : Math.min(2, peerList.length + Math.max(0, requiredPeers - peerList.length)) > 1 ? 2 : 1;

  if (!isHost && !nameConfirmed) {
    return (
      <GuestNameScreen
        boothData={boothData.participant1 ? boothData : null}
        localStream={localStream}
        authError={guestAuthError}
        onJoin={(name) => {
          setGuestAuthError("");
          setGuestName(name); guestNameRef.current = name; setNameConfirmed(true);
          try {
            const s = JSON.parse(localStorage.getItem(`framoji-room-${roomId}`) || "{}");
            localStorage.setItem(`framoji-room-${roomId}`, JSON.stringify({ ...s, guestName: name }));
          } catch (_) { }
        }}
      />
    );
  }

  if (roomFull) return <RoomFullScreen navigate={navigate} />;
  if (roomEnded) return (
    <div style={{ minHeight: "100vh", background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} className="aurora-bg">
      <div className="card" style={{ textAlign: "center", maxWidth: 400, padding: 32 }}>
        <div style={{ fontSize: 42, marginBottom: 14 }}>🎞️</div>
        <h2 className="display" style={{ fontSize: 26, color: "var(--cream)", marginBottom: 10 }}>The booth has ended</h2>
        <p style={{ color: "var(--text-sub)", marginBottom: 24, lineHeight: 1.65, fontSize: 14 }}>The host ended this photo session. Thanks for making memories together!</p>
        <button className="btn btn-primary" style={{ padding: "11px 26px", fontSize: 14, borderRadius: 10 }} onClick={() => navigate("/")}>Back to home</button>
      </div>
    </div>
  );
  if (roomNotFound) return (
    <div style={{ minHeight: "100vh", background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <div style={{ width: 50, height: 50, borderRadius: 13, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}><AlertCircle size={22} color="var(--text-sub)" /></div>
        <h2 className="display" style={{ fontSize: 24, color: "var(--cream)", marginBottom: 10 }}>Room not found</h2>
        <p style={{ color: "var(--text-sub)", marginBottom: 24, lineHeight: 1.65, fontSize: 14 }}>This booth has expired or the code is incorrect.</p>
        <button className="btn btn-primary" style={{ padding: "11px 26px", fontSize: 14, borderRadius: 10 }} onClick={() => navigate("/")}>Back to home</button>
      </div>
    </div>
  );
  if (camError) return (
    <div style={{ minHeight: "100vh", background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <div style={{ width: 50, height: 50, borderRadius: 13, background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}><AlertCircle size={22} color="#F87171" /></div>
        <h2 className="display" style={{ fontSize: 24, color: "var(--cream)", marginBottom: 10 }}>Camera access needed</h2>
        <p style={{ color: "var(--text-sub)", marginBottom: 24, lineHeight: 1.65, fontSize: 14 }}>Allow camera access in your browser settings, then refresh.</p>
        <button className="btn btn-primary" style={{ padding: "11px 26px", fontSize: 14, borderRadius: 10 }} onClick={() => window.location.reload()}>Refresh page</button>
      </div>
    </div>
  );

  const renderCameraGrid = () => {
    const corners = [
      { top: 7, left: 7, borderTop: "2px solid rgba(167,139,250,0.5)", borderLeft: "2px solid rgba(167,139,250,0.5)" },
      { top: 7, right: 7, borderTop: "2px solid rgba(167,139,250,0.5)", borderRight: "2px solid rgba(167,139,250,0.5)" },
      { bottom: 7, left: 7, borderBottom: "2px solid rgba(167,139,250,0.5)", borderLeft: "2px solid rgba(167,139,250,0.5)" },
      { bottom: 7, right: 7, borderBottom: "2px solid rgba(167,139,250,0.5)", borderRight: "2px solid rgba(167,139,250,0.5)" },
    ];
    const LocalCameraSlot = ({ label }) => (
      <div style={{ position: "relative", aspectRatio: "4/3", background: "#0a0a0a" }}>
        <LocalCameraView stream={localStream} videoRef={localVideoRef} isMirrored={isMirrored} />
        {corners.map((s, i) => <div key={i} style={{ position: "absolute", width: 14, height: 14, ...s }} />)}
        {label && (
          <div style={{ position: "absolute", bottom: 7, left: 7, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)", borderRadius: 4, padding: "2px 7px", fontSize: 10, fontWeight: 700, color: "#fff" }}>
            {label}
          </div>
        )}
      </div>
    );

    if (isSolo) {
      return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 2 }}>
          <LocalCameraSlot label={boothData.participant1 || "You"} />
        </div>
      );
    }

    const hostPeer = peerList.find(p => p.isHost);
    const guestPeers = peerList.filter(p => !p.isHost);
    const ordered = hostPeer ? [hostPeer, ...guestPeers] : guestPeers;
    const isDuoMode = boothData.modeConfig?.participants === "duo";
    const emptyCount = Math.max(0, requiredPeers - ordered.length);

    const iAmPeer = (peer) => {
      if (!peer) return false;
      return peer.id === socket.id || peer.id === mySocketIdRef.current;
    };

    return (
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${gridCols}, 1fr)`, gap: 2 }}>
        {ordered.map(peer => {
          const isMe = iAmPeer(peer);
          return (
            <div key={peer.id} style={{ position: "relative", aspectRatio: "4/3", background: "#0a0a0a" }}>
              {isMe ? (
                <>
                  <LocalCameraView stream={localStream} videoRef={localVideoRef} isMirrored={isMirrored} />
                  {corners.map((s, i) => <div key={i} style={{ position: "absolute", width: 14, height: 14, ...s }} />)}
                </>
              ) : remoteStreams[peer.id] ? (
                <RemoteVideo stream={remoteStreams[peer.id]} name="" />
              ) : (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px", fontSize: 14, fontWeight: 700, color: "var(--mauve)" }}>
                      {(peer.name?.[0] || "?").toUpperCase()}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-sub)" }}>Connecting…</div>
                  </div>
                </div>
              )}
              <div style={{ position: "absolute", bottom: 7, left: 7, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)", borderRadius: 4, padding: "2px 7px", fontSize: 10, fontWeight: 700, color: "#fff" }}>
                {peer.name}
              </div>
            </div>
          );
        })}
        {!isSolo && Array.from({ length: emptyCount }).map((_, i) => (
          <div key={`slot-${i}`} style={{ aspectRatio: "4/3", background: "#0d0d14", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", border: "1px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={15} color="var(--text-sub)" />
            </div>
            <div style={{ fontSize: 11, color: "var(--text-sub)", textAlign: "center", padding: "0 8px" }}>
              {isDuoMode && boothData.participant2 && i === 0 ? `Waiting for ${boothData.participant2}…` : "Waiting for friend"}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)" }}>
      {/* Permanent hidden video element so doCapture always has a valid video source */}
      <video
        ref={hiddenVideoRef}
        autoPlay
        muted
        playsInline
        style={{
          position: "fixed",
          left: "-10000px",
          top: "-10000px",
          width: "640px",
          height: "480px",
          pointerEvents: "none"
        }}
      />
      <AnimatePresence>
        {flash && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}
          style={{ position: "fixed", inset: 0, background: "white", zIndex: 100 }} />}
      </AnimatePresence>

      <Countdown countdown={countdown} />

      <AnimatePresence>
        {capturedPhoto && isEffectiveHost && (
          <PhotoPreview
            photo={capturedPhoto}
            currentPhoto={validPhotos.length + 1}
            onRetake={() => {
              setCapturedPhoto(null);
              if (!isSolo) socket.emit("photo-retake", { roomId, photoIndex: photoIdxRef.current });
            }}
            onContinue={acceptPhoto}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {capturedPhoto && !isEffectiveHost && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(9,9,16,0.95)", backdropFilter: "blur(18px)", zIndex: 60, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <img src={capturedPhoto} alt="captured"
              style={{ maxWidth: "min(90vw, 480px)", maxHeight: "60vh", objectFit: "contain", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }} />
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "var(--text)", fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Shot captured!</p>
              <p style={{ color: "var(--text-sub)", fontSize: 13 }}>Waiting for host to accept or retake…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReview && (
          <PhotoReview
            photos={validPhotos}
            isReadOnly={!isEffectiveHost}
            onRetakePhoto={isEffectiveHost ? (i => {
              setPhotos(p => { const n = [...p]; n[i] = undefined; return n; });
              setPhotoIdx(i); photoIdxRef.current = i;
              setShowReview(false);
              if (!isSolo) socket.emit("photo-retake", { roomId, photoIndex: i });
            }) : undefined}
            onContinue={isEffectiveHost ? onStripDone : undefined}
          />
        )}
      </AnimatePresence>

      <nav style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(9,9,16,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 22px" }}>
        <div
          onClick={() => {
            if (window.confirm("Leave this photobooth session and return to home?")) {
              navigate("/");
            }
          }}
          style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", userSelect: "none" }}
          title="Back to Home"
        >
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--violet)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, transition: "transform 0.15s ease" }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >🎞️</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--cream)", display: "flex", alignItems: "center", gap: 5 }}>
              {boothData.participant1 || "Booth"}
              <span style={{ fontSize: 10, color: "var(--violet-lt)", fontWeight: 500 }}>· framoji</span>
            </div>
            <div className="hide-mobile" style={{ fontSize: 11, color: "var(--text-sub)" }}>{modeLabel}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 6px rgba(34,197,94,0.5)" }} />
            <span style={{ fontSize: 11, color: "var(--text-sub)" }}>
              {isSolo ? "Solo" : `${peerList.length} online`} · <span style={{ color: "var(--mauve)", fontWeight: 700, fontFamily: "monospace" }}>{roomId.toUpperCase()}</span>
            </span>
          </div>
          <button
            onClick={() => {
              if (window.confirm("Leave this photobooth session and return to home?")) {
                navigate("/");
              }
            }}
            className="btn btn-ghost"
            style={{ padding: "6px 12px", fontSize: 12, borderRadius: 8, gap: 5 }}
            title="Leave photobooth and return to home"
          >
            <Home size={13} />
            <span className="hide-mobile">Home</span>
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "22px 18px" }}>
        {hostLeft && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: "11px 15px", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(167,139,250,0.28)", borderRadius: 10, marginBottom: 14, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--mauve)" }}>
            <AlertCircle size={14} />
            The host left the booth. Your completed photostrip is still available to save.
          </motion.div>
        )}
        {!showStrip ? (
          <>
            {hostDisconnected && !isEffectiveHost && (
              <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
                style={{ padding: "10px 16px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.22)", borderRadius: 10, marginBottom: 14, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#FCD34D" }}>
                <AlertCircle size={13} />
                Host disconnected — waiting for them to reconnect…
              </motion.div>
            )}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 11, color: "var(--text-sub)" }}>
                <span>Photo {Math.min(validPhotos.length + 1, photoTarget)} of {photoTarget}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
            </div>
            <div className="room-main-grid">
              <div>
                <div className="card" style={{ overflow: "hidden" }}>
                  <div style={{ padding: "10px 15px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57" }} />
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFBD2E" }} />
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28C840" }} />
                    <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: "var(--text-sub)" }}>
                      {isSolo ? "Your camera" : `${peerList.length} camera${peerList.length !== 1 ? "s" : ""} — live preview`}
                    </span>
                    {!isSolo && peerList.length > 1 && (
                      <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--violet-lt)", fontWeight: 600 }}>This is what will be captured</span>
                    )}
                  </div>
                  <div style={{ background: "#000", maxWidth: 760, margin: "0 auto", width: "100%" }}>
                    {renderCameraGrid()}
                  </div>
                  {camNotice && (
                    <div style={{ padding: "8px 14px", background: "rgba(245,158,11,0.12)", borderBottom: "1px solid rgba(245,158,11,0.25)", color: "#FCD34D", fontSize: 11, textAlign: "center", fontWeight: 600 }}>
                      ⚠️ {camNotice}
                    </div>
                  )}
                  <div style={{ padding: "8px 12px", background: "rgba(15,14,26,0.85)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
                    <button
                      onClick={toggleMic}
                      className="btn btn-ghost"
                      style={{ padding: "6px 14px", fontSize: 12, borderRadius: 8, background: isMicMuted ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.06)", color: isMicMuted ? "#FCA5A5" : "var(--text)", border: `1px solid ${isMicMuted ? "rgba(239,68,68,0.3)" : "var(--border)"}` }}
                    >
                      {isMicMuted ? <MicOff size={13} /> : <Mic size={13} />}
                      {isMicMuted ? "Mic Muted" : "Mic On"}
                    </button>
                    <button
                      onClick={toggleVideo}
                      className="btn btn-ghost"
                      style={{ padding: "6px 14px", fontSize: 12, borderRadius: 8, background: isVideoOff ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.06)", color: isVideoOff ? "#FCA5A5" : "var(--text)", border: `1px solid ${isVideoOff ? "rgba(239,68,68,0.3)" : "var(--border)"}` }}
                    >
                      {isVideoOff ? <VideoOff size={13} /> : <Video size={13} />}
                      {isVideoOff ? "Cam Off" : "Cam On"}
                    </button>
                    <button
                      onClick={switchCamera}
                      className="btn btn-ghost"
                      style={{ padding: "6px 14px", fontSize: 12, borderRadius: 8 }}
                      title="Flip camera device"
                    >
                      <RefreshCw size={13} /> Switch Cam
                    </button>
                    <button
                      onClick={() => setIsMirrored(prev => !prev)}
                      className="btn btn-ghost"
                      style={{
                        padding: "6px 14px",
                        fontSize: 12,
                        borderRadius: 8,
                        background: isMirrored ? "rgba(124,58,237,0.18)" : "rgba(255,255,255,0.06)",
                        color: isMirrored ? "var(--violet-lt)" : "var(--text)",
                        border: `1px solid ${isMirrored ? "rgba(124,58,237,0.4)" : "var(--border)"}`
                      }}
                      title="Flip or Mirror camera"
                    >
                      <FlipHorizontal size={13} /> {isMirrored ? "Mirror View" : "Real View"}
                    </button>
                  </div>
                  <div style={{ padding: 12 }}>
                    {waitingFor && isEffectiveHost ? (
                      <div style={{ padding: "12px 0", textAlign: "center", color: "var(--violet-lt)", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--violet-lt)", animation: "pulse 1.4s ease-in-out infinite" }} />
                        {waitingFor}
                      </div>
                    ) : canShoot ? (
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
                        onClick={startShot} className="btn btn-rose"
                        style={{ width: "100%", padding: 14, fontSize: 14, borderRadius: 10, gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.55)", animation: "pulse 1.4s ease-in-out infinite", flexShrink: 0 }} />
                        {isSolo ? `Take photo ${validPhotos.length + 1} of ${photoTarget}` : `Start shot ${validPhotos.length + 1} — all cameras sync`}
                      </motion.button>
                    ) : (
                      <div style={{ padding: "12px 0", textAlign: "center", color: "var(--text-sub)", fontSize: 13 }}>
                        Waiting for host to start the shot
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                {!isSolo && <InvitePanel roomId={roomId} boothData={boothData} peerList={peerList} />}
                <div className="card" style={{ padding: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 10, display: "flex", justifyContent: "space-between", letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-sub)" }}>
                    <span>Captured</span>
                    <span style={{ fontWeight: 400 }}>{validPhotos.length}/{photoTarget}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {Array.from({ length: photoTarget }).map((_, i) => (
                      <div key={i} style={{ borderRadius: 6, overflow: "hidden", aspectRatio: "16/9", background: photos[i] ? "transparent" : "rgba(255,255,255,0.02)", border: `1px solid ${photos[i] ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)"}`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                        {photos[i]
                          ? <img src={photos[i]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <div style={{ fontSize: 9, color: "#3D3858", fontWeight: 700, letterSpacing: "0.07em" }}>{i === validPhotos.length ? "NEXT" : `SHOT ${i + 1}`}</div>}
                        {photos[i] && <div style={{ position: "absolute", top: 4, left: 4, background: "rgba(34,197,94,0.9)", borderRadius: 3, padding: "1px 5px", fontSize: 8, fontWeight: 700, color: "white" }}>✓</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <h1 className="display" style={{ fontSize: 30, color: "var(--cream)", marginBottom: 6 }}>Your strip is ready</h1>
              <p style={{ color: "var(--text-sub)", fontSize: 13 }}>Apply a filter, drop stickers, write a caption — then save.</p>
            </div>
            <FilterSelector selectedFilter={filter} setSelectedFilter={setFilter} />
            <div style={{ maxWidth: 260, margin: "0 auto 16px", textAlign: "center" }}>
              <input className="field" placeholder="Add a caption (optional)" value={caption}
                maxLength={200} onChange={e => setCaption(e.target.value)} style={{ textAlign: "center", fontSize: 13 }} />
            </div>
            <StickerEditor
              stickers={stickers}
              setStickers={setStickers}
              selectedStickerId={selectedStickerId}
              setSelectedStickerId={setSelectedStickerId}
            />
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
              <div
                id="photostrip-export"
                ref={photostripExportRef}
                style={{ position: "relative", display: "inline-block" }}
                onClick={() => setSelectedStickerId(null)}
              >
                <Photostrip
                  photos={validPhotos}
                  participant1={boothData.participant1}
                  participant2={boothData.participant2}
                  allNames={stripNames}
                  theme={boothData.theme}
                  layout={boothData.layout}
                  selectedFilter={filter}
                  caption={caption}
                />
                {stickers.map((s) => (
                  <motion.div
                    key={s.id}
                    drag
                    dragConstraints={photostripExportRef}
                    dragElastic={0.05}
                    dragMomentum={false}
                    initial={{ x: s.x, y: s.y }}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      fontSize: s.size || 32,
                      cursor: "grab",
                      userSelect: "none",
                      touchAction: "none",
                      zIndex: selectedStickerId === s.id ? 50 : 10,
                      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                      transform: s.rotate ? `rotate(${s.rotate}deg)` : undefined,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStickerId(s.id);
                    }}
                  >
                    {s.emoji}
                    {selectedStickerId === s.id && !downloading && (
                      <div
                        style={{
                          position: "absolute",
                          top: -6,
                          right: -6,
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: "#EF4444",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          fontWeight: "bold",
                          cursor: "pointer",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setStickers((prev) => prev.filter((st) => st.id !== s.id));
                          if (selectedStickerId === s.id) setSelectedStickerId(null);
                        }}
                      >
                        ×
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 22, flexWrap: "wrap" }}>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="btn btn-primary anim-glow" style={{ padding: "12px 30px", fontSize: 14, borderRadius: 11 }}
                onClick={downloadStrip} disabled={downloading}>
                <Download size={14} />
                {downloading ? "Generating…" : "Download PNG"}
              </motion.button>
              <button className="btn btn-ghost" style={{ padding: "12px 22px", fontSize: 13, borderRadius: 11 }}
                onClick={copyImageToClipboard}>
                {copiedImage ? <Check size={13} color="#86EFAC" /> : <ImageIcon size={13} />}
                {copiedImage ? "Copied Image!" : "Copy Image"}
              </button>
              <button className="btn btn-ghost" style={{ padding: "12px 22px", fontSize: 13, borderRadius: 11 }}
                onClick={openMobileQrModal}>
                <QrCode size={13} /> Mobile QR Share
              </button>
              <button className="btn btn-ghost" style={{ padding: "12px 22px", fontSize: 13, borderRadius: 11 }}
                onClick={() => {
                  try {
                    localStorage.removeItem(`framoji-session-${roomId}`);
                    localStorage.removeItem(`framoji-pid-${roomId}`);
                    localStorage.removeItem(`framoji-room-${roomId}`);
                  } catch (_) { }
                  navigate("/");
                }}>
                <RefreshCw size={12} /> New booth
              </button>
            </div>

            <AnimatePresence>
              {showQrModal && (() => {
                const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
                const origin = isLocal && lanIp
                  ? `http://${lanIp}:${window.location.port || "5173"}`
                  : window.location.origin;
                const computedUrl = qrTab === "strip"
                  ? `${origin}/strip/${stripIdRef.current}`
                  : `${origin}/room/${roomId}`;
                const activeUrl = customQrUrl.trim() || computedUrl;

                return (
                  <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(9,9,16,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="card" style={{ maxWidth: 420, width: "100%", padding: 24, textAlign: "center", position: "relative" }}>
                      <button onClick={() => setShowQrModal(false)} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: "var(--text-sub)", cursor: "pointer" }}>
                        <X size={18} />
                      </button>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "var(--violet-lt)" }}>
                        <QrCode size={22} />
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: "var(--cream)" }}>Scan to open on phone</h3>
                      <p style={{ fontSize: 12, color: "var(--text-sub)", marginBottom: 14, lineHeight: 1.5 }}>
                        Scan this QR code with your smartphone camera to download your saved photostrip or open this photobooth session.
                      </p>

                      {/* Tab Switcher */}
                      <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 3, marginBottom: 14 }}>
                        <button
                          type="button"
                          onClick={() => { setQrTab("strip"); setCustomQrUrl(""); }}
                          style={{
                            flex: 1,
                            padding: "6px 10px",
                            fontSize: 11,
                            fontWeight: 700,
                            borderRadius: 8,
                            border: "none",
                            cursor: "pointer",
                            background: qrTab === "strip" ? "var(--violet-lt)" : "transparent",
                            color: qrTab === "strip" ? "#000" : "var(--text-sub)",
                            transition: "all 0.2s ease"
                          }}
                        >
                          📸 Download Strip
                        </button>
                        <button
                          type="button"
                          onClick={() => { setQrTab("room"); setCustomQrUrl(""); }}
                          style={{
                            flex: 1,
                            padding: "6px 10px",
                            fontSize: 11,
                            fontWeight: 700,
                            borderRadius: 8,
                            border: "none",
                            cursor: "pointer",
                            background: qrTab === "room" ? "var(--violet-lt)" : "transparent",
                            color: qrTab === "room" ? "#000" : "var(--text-sub)",
                            transition: "all 0.2s ease"
                          }}
                        >
                          👥 Booth Session
                        </button>
                      </div>

                      {/* QR Code Container */}
                      <div style={{ background: "#fff", padding: 12, borderRadius: 12, display: "inline-block", marginBottom: 12 }}>
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(activeUrl)}`} alt="QR Code" style={{ width: 160, height: 160, display: "block" }} />
                      </div>

                      {/* Status / Link copy bar */}
                      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 12 }}>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: "6px 14px", fontSize: 11, borderRadius: 8 }}
                          onClick={() => {
                            navigator.clipboard.writeText(activeUrl);
                            setCopiedQrUrl(true);
                            setTimeout(() => setCopiedQrUrl(false), 2000);
                          }}
                        >
                          {copiedQrUrl ? <Check size={11} color="#86EFAC" /> : <Copy size={11} />}
                          {copiedQrUrl ? "Link Copied!" : "Copy Link"}
                        </button>
                        <a
                          href={activeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-ghost"
                          style={{ padding: "6px 14px", fontSize: 11, borderRadius: 8, textDecoration: "none" }}
                        >
                          <ExternalLink size={11} /> Test Link
                        </a>
                      </div>

                      {/* Wi-Fi / LAN IP Info */}
                      <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text-sub)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                            Target URL
                          </label>
                          {isLocal && lanIp && (
                            <span style={{ fontSize: 9, color: "#86EFAC", background: "rgba(134,239,172,0.1)", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>
                              Wi-Fi IP: {lanIp}
                            </span>
                          )}
                        </div>
                        <input
                          className="field"
                          placeholder={computedUrl}
                          value={customQrUrl}
                          onChange={e => setCustomQrUrl(e.target.value)}
                          style={{ fontSize: 11, padding: "7px 10px" }}
                        />
                      </div>

                      {isLocal && (
                        <p style={{ fontSize: 10, color: "#FCD34D", lineHeight: 1.4, textAlign: "left", background: "rgba(245,158,11,0.08)", padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(245,158,11,0.2)" }}>
                          💡 <b>Wi-Fi Tip:</b> Make sure your smartphone is connected to the same Wi-Fi network as this computer to scan and open the page.
                        </p>
                      )}

                      {qrSaving && (
                        <p style={{ fontSize: 11, color: "var(--mauve)", marginTop: 8 }}>
                          Saving photostrip to cloud…
                        </p>
                      )}
                    </motion.div>
                  </div>
                );
              })()}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
