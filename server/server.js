const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const crypto = require("crypto");
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const os = require("os");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const cloudinary = require("./config/cloudinary");

const app = express();
const server = http.createServer(app);

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

const devOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174"
];

const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(s => s.trim()).filter(Boolean)
  : [];

const allowedOrigins = process.env.NODE_ENV === "production"
  ? (envOrigins.length > 0 ? envOrigins : ["https://framoji-frontend.onrender.com"])
  : [...devOrigins, ...envOrigins];

function isOriginAllowed(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) return true;
  // In development, allow any local network / private IP or localhost with any port
  if (process.env.NODE_ENV !== "production") {
    if (/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin)) {
      return true;
    }
  }
  return false;
}

const corsOptions = {
  origin: function (origin, callback) {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "5mb" }));

// Request ID tracing middleware
app.use((req, res, next) => {
  req.id = crypto.randomUUID().slice(0, 8);
  res.setHeader("X-Request-Id", req.id);
  next();
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);

const stripLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get("/health", (req, res) => {
  if (!isMongoConnected) {
    return res.status(503).json({
      status: "error",
      mongo: false,
    });
  }

  res.json({
    status: "ok",
    mongo: true,
    timestamp: new Date(),
  });
});

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/framoji";
let isMongoConnected = false;

mongoose.connection.on("connected", () => {
  isMongoConnected = true;
  console.log(`[db] MongoDB connection established → ${mongoose.connection.name}`);
});

mongoose.connection.on("disconnected", () => {
  isMongoConnected = false;
  console.warn("[db] MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("[db] MongoDB connection error:", err.message);
});

mongoose.connect(MONGODB_URI, {
  dbName: "framoji",
  serverSelectionTimeoutMS: 5000,
})
  .then(() => {
    isMongoConnected = true;
  })
  .catch((err) => {
    console.error("[db] MongoDB connection failed:", err.message);

    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  });

const ROOM_ID_RE = /^[a-zA-Z0-9_-]{6,30}$/;
const STRIP_ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;
const MAX_STRIP_DATA_URL = 4_500_000;
const IMAGE_DATA_URL_RE = /^data:image\/(?:png|jpeg|webp);base64,/i;

function isValidRoomId(value) {
  return typeof value === "string" && ROOM_ID_RE.test(value);
}

function isValidStripId(value) {
  return typeof value === "string" && STRIP_ID_RE.test(value);
}

function isValidPhotoIndex(value, room) {
  const max = room?.config?.photoCount || 4;
  return Number.isInteger(value) && value >= 0 && value < max;
}

function hashEditToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function safeTokenMatch(provided, stored) {
  if (!provided || !stored) return false;
  try {
    const a = Buffer.from(hashEditToken(provided), "hex");
    const b = Buffer.from(stored, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

const PhotostripSchema = new mongoose.Schema({
  stripId: { type: String, required: true, unique: true },
  cloudinaryUrl: { type: String, required: true },
  editTokenHash: { type: String, select: false },
  theme: { type: String },
  layout: { type: String },
  names: { type: String },
  caption: { type: String },
  roomId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const PhotostripModel = mongoose.model("Photostrip", PhotostripSchema);

const AnalyticsEventSchema = new mongoose.Schema({
  event: { type: String, required: true, index: true },
  sessionId: { type: String, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now, expires: 7776000 }, // 90 days in seconds
});

const AnalyticsEventModel = mongoose.model("AnalyticsEvent", AnalyticsEventSchema);

/* ── Express REST API Endpoints ── */

app.post("/api/photostrips", stripLimiter, async (req, res) => {
  try {
    let { stripId, dataUrl, theme, layout, names, caption, roomId } = req.body;

    if (!dataUrl || typeof dataUrl !== "string" || !IMAGE_DATA_URL_RE.test(dataUrl) || dataUrl.length > MAX_STRIP_DATA_URL) {
      return res.status(400).json({ error: "Invalid photostrip image. PNG, JPEG, or WebP under 4.5MB is required." });
    }

    const cleanStripId = isValidStripId(stripId) ? stripId : crypto.randomUUID();

    if (roomId && !isValidRoomId(roomId)) {
      return res.status(400).json({ error: "Invalid roomId format" });
    }

    if (!isMongoConnected) {
      return res.status(503).json({
        error: "Database unavailable. Photostrip was not saved."
      });
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(503).json({ error: "Cloudinary image storage is not configured" });
    }

    const providedEditToken = req.get("x-strip-edit-token");
    const existing = await PhotostripModel.findOne({ stripId: cleanStripId }).select("+editTokenHash");

    let editToken = null;
    if (existing) {
      if (!existing.editTokenHash || !safeTokenMatch(providedEditToken, existing.editTokenHash)) {
        return res.status(403).json({
          error: "Photostrip edit authorization required",
        });
      }
    } else {
      editToken = crypto.randomBytes(32).toString("hex");
    }

    let uploadRes;
    try {
      uploadRes = await cloudinary.uploader.upload(dataUrl, {
        folder: "framoji",
        public_id: cleanStripId,
        overwrite: true,
        invalidate: true,
      });
      console.log(`[req:${req.id}] Cloudinary upload successful → ${cleanStripId}`);
    } catch (cErr) {
      console.error(`[req:${req.id}] Cloudinary upload failed:`, cErr.message);
      return res.status(503).json({ error: "Unable to save photostrip to cloud storage" });
    }

    const payload = {
      stripId: cleanStripId,
      cloudinaryUrl: uploadRes.secure_url,
      theme: String(theme || "").slice(0, 30),
      layout: String(layout || "").slice(0, 30),
      names: String(names || "").slice(0, 100),
      caption: String(caption || "").slice(0, 200),
      roomId: String(roomId || "").slice(0, 50),
      createdAt: existing?.createdAt || new Date(),
    };

    if (editToken) {
      payload.editTokenHash = hashEditToken(editToken);
    }

    const doc = await PhotostripModel.findOneAndUpdate(
      { stripId: cleanStripId },
      payload,
      { upsert: true, new: true }
    );

    console.log(
      `[req:${req.id}] Photostrip saved in DB → ${doc.stripId}`
    );

    const response = doc.toObject();
    delete response.editTokenHash;
    if (editToken) {
      response.editToken = editToken;
    }

    return res.status(existing ? 200 : 201).json(response);
  } catch (err) {
    console.error("[api] post photostrip error:", err);
    return res.status(500).json({ error: "Failed to save photostrip" });
  }
});

app.get("/api/photostrips/:stripId", async (req, res) => {
  try {
    const { stripId } = req.params;
    if (!isValidStripId(stripId)) {
      return res.status(400).json({ error: "Invalid strip ID" });
    }

    if (!isMongoConnected) {
      return res.status(503).json({
        error: "Database unavailable"
      });
    }

    const doc = await PhotostripModel.findOne({ stripId });

    if (!doc) {
      return res.status(404).json({
        error: "Photostrip not found"
      });
    }

    return res.json(doc);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch photostrip" });
  }
});

app.get("/api/ice-servers", (req, res) => {
  const iceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.services.mozilla.com" },
  ];
  res.json({ iceServers });
});

function getLocalIp() {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === "IPv4" && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch (_) { }
  return "localhost";
}

app.get("/api/network-info", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.json({ devOnly: true, localIp: null });
  }
  const localIp = getLocalIp();
  res.json({
    localIp,
    serverPort: PORT,
    clientPort: 5173,
    clientLanUrl: `http://${localIp}:5173`,
  });
});

/* ── Privacy-Friendly Analytics Endpoints ── */

const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

const ALLOWED_ANALYTICS_EVENTS = new Set([
  "landing_page_view",
  "create_booth",
  "join_booth",
  "camera_permission_granted",
  "camera_permission_denied",
  "camera_not_found",
  "camera_in_use",
  "booth_started",
  "participant_joined",
  "photo_captured",
  "photostrip_generated",
  "download_clicked",
  "download_failed",
  "qr_opened",
  "share_clicked",
  "join_failed",
  "room_not_found",
  "peer_connection_failed",
  "photostrip_save_failed",
]);

function isValidAnalyticsSessionId(value) {
  return (
    typeof value === "string" &&
    /^[a-zA-Z0-9_-]{8,64}$/.test(value)
  );
}

function sanitizeMetadata(input, depth = 0) {
  if (depth > 2 || !input || typeof input !== "object" || Array.isArray(input)) return undefined;
  const clean = {};
  let keyCount = 0;
  for (const [k, v] of Object.entries(input)) {
    if (++keyCount > 15) break;
    const cleanKey = String(k).slice(0, 30);
    if (/token|password|secret|auth|credit|cookie/i.test(cleanKey)) continue;
    if (typeof v === "string") {
      if (v.length <= 60 && !v.startsWith("data:") && !/token|password|secret|auth/i.test(v)) {
        clean[cleanKey] = v;
      }
    } else if (typeof v === "number" || typeof v === "boolean") {
      clean[cleanKey] = v;
    } else if (typeof v === "object" && v !== null) {
      const nested = sanitizeMetadata(v, depth + 1);
      if (nested && Object.keys(nested).length > 0) {
        clean[cleanKey] = nested;
      }
    }
  }
  return clean;
}

app.post(
  "/api/analytics/event",
  express.json({ limit: "10kb" }),
  analyticsLimiter,
  async (req, res) => {
    try {
      const { event, sessionId, metadata } = req.body || {};
      if (!event || typeof event !== "string" || !ALLOWED_ANALYTICS_EVENTS.has(event)) {
        return res.status(400).json({ error: "Invalid or unsupported event" });
      }

      const cleanMeta = sanitizeMetadata(metadata) || {};

      if (isMongoConnected) {
        await AnalyticsEventModel.create({
          event,
          sessionId: isValidAnalyticsSessionId(sessionId) ? sessionId : undefined,
          metadata: cleanMeta,
        });
      }

      return res.status(204).end();
    } catch (err) {
      console.warn("[analytics] error logging event:", err.message);
      return res.status(500).json({ error: "Failed to record event" });
    }
  }
);

const analyticsStatsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get("/api/analytics/stats", analyticsStatsLimiter, async (req, res) => {
  try {
    const adminKey = process.env.ANALYTICS_ADMIN_KEY;
    if (!adminKey || req.headers["x-admin-key"] !== adminKey) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!isMongoConnected) return res.json({ counts: {} });
    const stats = await AnalyticsEventModel.aggregate([
      { $group: { _id: "$event", count: { $sum: 1 } } }
    ]);
    const counts = {};
    stats.forEach(s => { counts[s._id] = s.count; });
    return res.json({ counts });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch stats" });
  }
});

const io = new Server(server, {
  cors: corsOptions,
  maxHttpBufferSize: 5e6,
});

const rooms = {};

function getRoom(rid) {
  if (!rooms[rid]) {
    rooms[rid] = {
      config: null,
      phase: "waiting",
      peers: {},
      hostPid: null,
      hostToken: null,
      guestTokens: {},
      photos: {},
      peerOrder: [],
      acceptedPhotos: [],
      photoIdx: 0,
      deletionTimer: null,
    };
  }
  return rooms[rid];
}

function broadcastPeers(rid) {
  const room = rooms[rid];
  if (!room) return;
  // Security requirement: broadcast only { id, name, joined, isHost }
  const list = Object.entries(room.peers).map(([id, info]) => ({
    id,
    name: info.name,
    joined: info.joined,
    isHost: !!info.isHost,
  }));
  io.to(rid).emit("peers-updated", list);
}

function getCapacity(room) {
  if (!room.config) return Infinity;
  if (room.config.isSolo) return 1;
  if (room.config.modeConfig?.participants === "duo") return 2;
  if (room.config.friendCount) return room.config.friendCount;
  return Infinity;
}

function isRoomHost(room, socket) {
  return Boolean(room && room.peers[socket.id]?.isHost);
}

function isRoomParticipant(room, socket) {
  return Boolean(room && room.peers[socket.id]);
}

io.on("connection", (socket) => {
  const socketRateLimits = new Map();
  function checkRateLimit(type, limitMs) {
    const now = Date.now();
    const last = socketRateLimits.get(type) || 0;
    if (now - last < limitMs) return false;
    socketRateLimits.set(type, now);
    return true;
  }

  socket.on("connect-room", ({ roomId, config, name, participantId, isHost, rejoinToken }) => {
    // Validate roomId
    if (!isValidRoomId(roomId)) {
      socket.emit("room-not-found");
      return;
    }

    const cleanName = String(name || "").trim().slice(0, 50);
    const cleanPid = String(participantId || "").trim().slice(0, 64);
    const cleanToken = typeof rejoinToken === "string" ? rejoinToken.trim() : null;

    let room = rooms[roomId];

    /* ── Case 1: Host reconnecting to an existing room ── */
    const isClaimingHost = Boolean(isHost || (cleanPid && room && cleanPid === room.hostPid));
    if (room && room.config && isClaimingHost) {
      const isAuthorizedHost = Boolean(cleanToken && room.hostToken && cleanToken === room.hostToken);
      if (!isAuthorizedHost) {
        console.warn(`[auth] Unauthorized host reconnection attempt for room "${roomId}" from socket ${socket.id}`);
        socket.emit("host-auth-failed");
        return;
      }

      // Authenticated host reconnection!
      if (room.deletionTimer) {
        clearTimeout(room.deletionTimer);
        room.deletionTimer = null;
        console.log(`[server] Host reconnected to ${roomId}, cleared deletion timer.`);
      }

      socket.join(roomId);
      socket.roomId = roomId;
      socket.myName = cleanName || room.config.participant1 || "Host";

      // Clean up any stale sockets for this host
      Object.keys(room.peers).forEach(sid => {
        if (room.peers[sid].isHost || room.peers[sid].participantId === cleanPid) {
          delete room.peers[sid];
          room.peerOrder = room.peerOrder.filter(id => id !== sid);
        }
      });

      room.peers[socket.id] = { name: socket.myName, joined: Date.now(), isHost: true, participantId: cleanPid };
      if (!room.peerOrder.includes(socket.id)) room.peerOrder.unshift(socket.id);

      socket.emit("host-confirmed");
      socket.emit("host-token", room.hostToken);
      socket.emit("room-config", room.config);
      socket.emit("room-phase", room.phase);
      socket.emit("room-sync-state", {
        acceptedPhotos: room.acceptedPhotos || [],
        photoIdx: room.photoIdx || 0,
        phase: room.phase,
      });
      socket.to(roomId).emit("peer-joined", { id: socket.id, name: socket.myName });
      broadcastPeers(roomId);
      console.log(`[server] "${socket.myName}" authenticated & reconnected to ${roomId} as host`);
      return;
    }

    /* ── Case 2: Host creating a brand new room ── */
    if (isHost && !room) {
      room = getRoom(roomId);
      room.config = {
        theme: String(config?.theme || "couple").slice(0, 20),
        layout: String(config?.layout || "classic").slice(0, 20),
        photoCount: [3, 4, 6].includes(Number(config?.photoCount)) ? Number(config.photoCount) : 4,
        participant1: cleanName || "Host",
        participant2: String(config?.participant2 || "").slice(0, 50),
        friendCount: Math.min(6, Math.max(2, Number(config?.friendCount) || 2)),
        modeConfig: config?.modeConfig || {},
        isSolo: Boolean(config?.isSolo),
      };

      const hostToken = crypto.randomUUID();
      room.hostPid = cleanPid;
      room.hostToken = hostToken;

      socket.join(roomId);
      socket.roomId = roomId;
      socket.myName = cleanName || "Host";
      room.peers[socket.id] = { name: socket.myName, joined: Date.now(), isHost: true, participantId: cleanPid };
      if (!room.peerOrder.includes(socket.id)) room.peerOrder.unshift(socket.id);

      socket.emit("host-token", hostToken);
      socket.emit("room-config", room.config);
      socket.emit("room-sync-state", {
        acceptedPhotos: room.acceptedPhotos || [],
        photoIdx: room.photoIdx || 0,
        phase: room.phase,
      });
      broadcastPeers(roomId);
      console.log(`[server] Room ${roomId} created by host "${cleanName}"`);
      return;
    }

    /* ── Case 3: Guest joining or reconnecting ── */
    if (!room || !room.config) {
      socket.emit("room-not-found");
      return;
    }

    if (!cleanPid || !/^[a-zA-Z0-9_-]{3,64}$/.test(cleanPid)) {
      console.warn(`[auth] Missing or invalid participantId for guest in room "${roomId}"`);
      socket.emit("guest-auth-failed", { message: "Invalid participant identity. Please join the booth again." });
      return;
    }

    // Guest token generation & validation (reconnect token is strictly mandatory)
    let guestToken = room.guestTokens[cleanPid];
    if (guestToken) {
      if (!cleanToken || cleanToken !== guestToken) {
        console.warn(`[auth] Invalid or missing guest token for pid "${cleanPid}" in room "${roomId}"`);
        socket.emit("guest-auth-failed", { message: "Your previous session expired. Please join the booth again." });
        return;
      }
    } else {
      guestToken = crypto.randomUUID();
      room.guestTokens[cleanPid] = guestToken;
    }

    // Clean up any stale sockets for this reconnecting guest
    if (cleanPid) {
      Object.keys(room.peers).forEach(sid => {
        if (room.peers[sid].participantId === cleanPid) {
          delete room.peers[sid];
          room.peerOrder = room.peerOrder.filter(id => id !== sid);
        }
      });
    }

    const nameTaken = Object.values(room.peers).some(
      p => p.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (nameTaken) { socket.emit("name-taken", { name: cleanName }); return; }
    const currentCount = Object.keys(room.peers).length;
    const maxCapacity = getCapacity(room);
    if (currentCount >= maxCapacity) { socket.emit("room-full"); return; }

    // CRUCIAL REQUIREMENT: Guest joins/rejoins must NEVER clear room.deletionTimer! Only host does.

    socket.join(roomId);
    socket.roomId = roomId;
    socket.myName = cleanName || "Guest";
    room.peers[socket.id] = { name: socket.myName, joined: Date.now(), isHost: false, participantId: cleanPid };
    if (!room.peerOrder.includes(socket.id)) room.peerOrder.push(socket.id);

    socket.emit("guest-token", guestToken);
    socket.emit("room-config", room.config);
    socket.emit("room-phase", room.phase);
    socket.emit("room-sync-state", {
      acceptedPhotos: room.acceptedPhotos || [],
      photoIdx: room.photoIdx || 0,
      phase: room.phase,
    });
    socket.to(roomId).emit("peer-joined", { id: socket.id, name: socket.myName });
    broadcastPeers(roomId);
    console.log(`[server] "${cleanName}" joined ${roomId} (${currentCount + 1}/${maxCapacity})`);
  });

  const relayToRoomPeer = (event, payload) => {
    const room = rooms[socket.roomId];
    if (!isRoomParticipant(room, socket) || !payload?.to || !room.peers[payload.to]) return;
    io.to(payload.to).emit(event, { ...payload, from: socket.id });
  };
  socket.on("webrtc-offer", (payload) => {
    if (!checkRateLimit("offer", 250)) return;
    if (!payload || typeof payload !== "object" || !payload.offer || typeof payload.offer !== "object") return;
    relayToRoomPeer("webrtc-offer", payload);
  });
  socket.on("webrtc-answer", (payload) => {
    if (!checkRateLimit("answer", 250)) return;
    if (!payload || typeof payload !== "object" || !payload.answer || typeof payload.answer !== "object") return;
    relayToRoomPeer("webrtc-answer", payload);
  });
  socket.on("webrtc-ice", (payload) => {
    if (!checkRateLimit("ice", 50)) return;
    if (!payload || typeof payload !== "object" || !payload.candidate || typeof payload.candidate !== "object") return;
    relayToRoomPeer("webrtc-ice", payload);
  });

  socket.on("start-countdown", (roomId) => {
    if (!checkRateLimit("countdown", 1500)) return;
    const room = rooms[roomId];
    if (!isRoomHost(room, socket)) return;
    room.phase = "countdown";
    const currentPhotoIndex = room.photoIdx || 0;
    io.to(roomId).emit("countdown-started", { photoIndex: currentPhotoIndex });
    io.to(roomId).emit("room-phase", "countdown");
  });

  socket.on("submit-frame", ({ roomId, photoIndex, frame }) => {
    if (!checkRateLimit("frame", 800)) return;
    const room = rooms[roomId];
    if (!room || !isRoomParticipant(room, socket)) {
      console.warn(`[submit-frame REJECTED] Not a valid participant or room: ${socket.id}`);
      return;
    }

    const maxPhotos = room.config?.photoCount || 4;
    if (!Number.isInteger(photoIndex) || photoIndex < 0 || photoIndex >= maxPhotos) {
      console.warn(`[submit-frame REJECTED] Invalid photoIndex ${photoIndex}`);
      return;
    }

    if (typeof frame !== "string" || !IMAGE_DATA_URL_RE.test(frame) || frame.length > 2_000_000) {
      console.warn(`[submit-frame REJECTED] Invalid frame data format or length ${frame?.length}`);
      return;
    }

    if (!room.photos[photoIndex]) room.photos[photoIndex] = {};
    room.photos[photoIndex][socket.id] = frame;

    if (!room[`frameTimer_${photoIndex}`]) {
      const FRAME_TIMEOUT_MS = 10000;
      room[`frameTimer_${photoIndex}`] = setTimeout(() => {
        delete room[`frameTimer_${photoIndex}`];
        const current = room.photos[photoIndex];
        if (!current) return;
        const activeIds = Object.keys(room.peers);
        const allSubmitted = activeIds.length > 0 && activeIds.every(id => current[id]);
        if (!allSubmitted) {
          console.warn(`[frame-timeout] photoIndex ${photoIndex} timed out in room ${roomId}. Aborting incomplete shot.`);
          delete room.photos[photoIndex];
          io.to(roomId).emit("photo-retake", { photoIndex, timeout: true });
        }
      }, FRAME_TIMEOUT_MS);
    }

    room.peerOrder = (room.peerOrder || []).filter(id => room.peers[id]);
    const activePeerIds = Object.keys(room.peers);
    activePeerIds.forEach(id => {
      if (!room.peerOrder.includes(id)) room.peerOrder.push(id);
    });
    const expectedIds = activePeerIds;
    const orderedIds = room.peerOrder.filter(id => room.peers[id]);

    const allSubmitted = expectedIds.length > 0 && expectedIds.every(id => room.photos[photoIndex]?.[id]);

    if (allSubmitted) {
      if (room[`frameTimer_${photoIndex}`]) {
        clearTimeout(room[`frameTimer_${photoIndex}`]);
        delete room[`frameTimer_${photoIndex}`];
      }
      const frames = { ...room.photos[photoIndex] };
      io.to(roomId).emit("frames-ready", {
        photoIndex,
        frames,
        peerOrder: orderedIds,
      });
      delete room.photos[photoIndex];
    }
  });

  socket.on("photo-accepted", ({ roomId, photoIndex, photo }) => {
    const room = rooms[roomId];
    if (!isRoomHost(room, socket)) return;

    const maxPhotos = room.config?.photoCount || 4;
    if (!Number.isInteger(photoIndex) || photoIndex < 0 || photoIndex >= maxPhotos) {
      console.warn(`[photo-accepted REJECTED] Invalid photoIndex: ${photoIndex}`);
      return;
    }
    if (photo && (typeof photo !== "string" || !IMAGE_DATA_URL_RE.test(photo) || photo.length > 5_000_000)) {
      console.warn(`[photo-accepted REJECTED] Invalid photo payload size/format`);
      return;
    }

    if (!room.acceptedPhotos) room.acceptedPhotos = [];
    if (photo) room.acceptedPhotos[photoIndex] = photo;
    room.photoIdx = photoIndex + 1;
    if (room.acceptedPhotos.filter(Boolean).length >= maxPhotos) {
      if (room.phase !== "strip") room.phase = "review";
    }
    socket.to(roomId).emit("photo-accepted", { photoIndex, photo });
  });

  socket.on("photo-retake", ({ roomId, photoIndex }) => {
    const room = rooms[roomId];
    if (!isRoomHost(room, socket)) return;

    const maxPhotos = room.config?.photoCount || 4;
    if (!Number.isInteger(photoIndex) || photoIndex < 0 || photoIndex >= maxPhotos) {
      console.warn(`[photo-retake REJECTED] Invalid photoIndex: ${photoIndex}`);
      return;
    }

    room.photoIdx = photoIndex;
    if (room.acceptedPhotos) delete room.acceptedPhotos[photoIndex];
    if (room.photos?.[photoIndex]) delete room.photos[photoIndex];
    room.phase = "countdown";
    socket.to(roomId).emit("photo-retake", { photoIndex });
  });

  socket.on("set-phase", ({ roomId, phase }) => {
    const room = rooms[roomId];
    if (!isRoomHost(room, socket)) return;

    const ALLOWED_PHASES = new Set(["waiting", "countdown", "review", "strip"]);
    if (!ALLOWED_PHASES.has(phase)) {
      console.warn(`[set-phase REJECTED] Unallowed phase string: ${phase}`);
      return;
    }

    room.phase = phase;
    io.to(roomId).emit("room-phase", phase);
  });

  socket.on("disconnect", () => {
    const roomId = socket.roomId;
    if (!roomId || !rooms[roomId]) return;
    const room = rooms[roomId];
    const wasHost = room.peers[socket.id]?.isHost;
    delete room.peers[socket.id];
    Object.keys(room.photos).forEach(idx => {
      if (room.photos[idx]) {
        delete room.photos[idx][socket.id];
        if (Object.keys(room.photos[idx]).length === 0) {
          delete room.photos[idx];
        } else {
          const photoIndex = Number(idx);
          const current = room.photos[photoIndex];
          const activeIds = Object.keys(room.peers);
          if (activeIds.length > 0 && activeIds.every(id => current[id])) {
            if (room[`frameTimer_${photoIndex}`]) {
              clearTimeout(room[`frameTimer_${photoIndex}`]);
              delete room[`frameTimer_${photoIndex}`];
            }
            const orderedIds = (room.peerOrder || []).filter(id => room.peers[id] && current[id]);
            io.to(roomId).emit("frames-ready", {
              photoIndex,
              frames: { ...current },
              peerOrder: orderedIds,
            });
            delete room.photos[photoIndex];
          }
        }
      }
    });
    room.peerOrder = room.peerOrder.filter(id => id !== socket.id);
    socket.to(roomId).emit("peer-left", { id: socket.id, name: socket.myName });
    broadcastPeers(roomId);
    if (wasHost) {
      if (room.phase === "strip") {
        socket.to(roomId).emit("host-left");
        console.log(`[server] Host left ${roomId} after completing the photostrip`);
        return;
      }

      socket.to(roomId).emit("host-disconnected");
      console.log(`[server] Host disconnected from ${roomId}, waiting for reconnection...`);
      if (room.deletionTimer) clearTimeout(room.deletionTimer);
      room.deletionTimer = setTimeout(() => {
        if (!Object.values(room.peers).some(p => p.isHost)) {
          io.to(roomId).emit("room-ended");
          delete rooms[roomId];
          console.log(`[server] Room ${roomId} ended because host did not reconnect`);
        }
      }, 30000);
    } else if (Object.keys(room.peers).length === 0) {
      if (room.deletionTimer) clearTimeout(room.deletionTimer);
      room.deletionTimer = setTimeout(() => {
        if (Object.keys(room.peers).length === 0) {
          delete rooms[roomId];
          console.log(`[server] Room ${roomId} deleted (empty)`);
        }
      }, 30000);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => console.log(`Framoji server running on port ${PORT}`));
