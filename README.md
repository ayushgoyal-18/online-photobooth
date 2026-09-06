# Framoji 🎞️

### One memory. Any distance.

A real-time virtual photobooth that lets people capture synchronized photos together from different locations.

🌐 **Live Demo:** [https://framoji-frontend.onrender.com](https://framoji-frontend.onrender.com)  
💻 **GitHub:** [https://github.com/ayushgoyal-18/online-photobooth](https://github.com/ayushgoyal-18/online-photobooth)

---

Framoji is a real-time virtual photobooth that lets people take synchronized photos together even when they are in different locations. Participants join a shared booth, connect their cameras through WebRTC, capture synchronized shots, review them, customize the final photostrip, and save/share the result.

---

## ✨ Features

- 🎥 **Real-time camera sharing with WebRTC**
- 🔄 **Real View / Mirror View camera toggle** (Real View by default)
- 👥 **Solo, Couple, and Friends/Group booth modes**
- ⏱️ **Synchronized countdown and photo capture**
- 🖼️ **Multi-participant frame aggregation**
- 🔄 **Room/session recovery after reconnects**
- 🎞️ **Photostrip review and retake flow**
- 🎨 **Filters, captions, layouts, and stickers**
- 📥 **PNG photostrip download**
- 📋 **Copy photostrip image to clipboard**
- 📱 **QR-based photostrip sharing** (`/strip/:stripId` → view & download saved strip)
- 🔗 **QR-based live booth/session joining** (`/room/:roomId` → join live session)
- ☁️ **Automatic server-side Cloudinary storage**
- 🗄️ **MongoDB persistence for saved photostrips**
- 🛡️ **Helmet, CORS allowlisting, rate limiting, and input validation**
- ♿ **Accessibility support for dialogs, labels, keyboard interaction, and reduced motion**
- 📱 **Fully responsive camera and photostrip UI**

---

## 🏗️ Architecture

```
                         ┌─────────────────────┐
                         │      Browser        │
                         │   React + Vite      │
                         └──────────┬──────────┘
                                    │
                     HTTPS / WSS    │
                                    ▼
                         ┌─────────────────────┐
                         │   Render Web Site   │
                         │   React Static Site │
                         └──────────┬──────────┘
                                    │
                           REST / Socket.IO
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │  Render Web Service │
                         │ Express + Socket.IO │
                         └──────┬──────┬───────┘
                                │      │
                    ┌───────────┘      └────────────┐
                    ▼                              ▼
             ┌─────────────┐                ┌─────────────┐
             │   MongoDB   │                │ Cloudinary  │
             │ photostrips │                │ image store │
             └─────────────┘                └─────────────┘
```

**Browser ↔ Browser media:** WebRTC peer-to-peer video/audio

### Main Flow

1. **Host creates a booth** and chooses Solo, Couple, or Friends mode.
2. **Server creates and stores** the room configuration.
3. **Guests open the room link or scan the Booth QR** (`/room/:roomId`) and enter their names.
4. **Browser camera permissions** are requested (defaulting to unmirrored Real View).
5. **WebRTC establishes peer-to-peer** camera connections.
6. **Host starts the synchronized countdown**.
7. **Each participant captures a local frame** matching their selected view orientation.
8. **Frames are submitted to the server** and aggregated into a unified frame.
9. **All participants receive the merged preview**.
10. **Host accepts or retakes each shot**.
11. **After all shots are accepted**, the host generates the photostrip.
12. **The completed photostrip is automatically uploaded** through the backend to Cloudinary.
13. **Photostrip metadata is persisted in MongoDB Atlas**.
14. **Users can download the photostrip, copy it, or scan the Saved Photostrip QR** (`/strip/:stripId`) to view and download on mobile.

---

## 📁 Project Structure

```
online-photobooth/
│
├── client/
│   ├── public/
│   │   ├── _redirects
│   │   └── og-image.png
│   ├── src/
│   │   ├── components/
│   │   │   ├── Countdown.jsx
│   │   │   ├── FilterSelector.jsx
│   │   │   ├── PhotoPreview.jsx
│   │   │   ├── PhotoReview.jsx
│   │   │   ├── Photostrip.jsx
│   │   │   └── StickerEditor.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── CreateBooth.jsx
│   │   │   ├── JoinBooth.jsx
│   │   │   ├── Room.jsx
│   │   │   └── PhotostripView.jsx
│   │   │
│   │   ├── App.jsx
│   │   ├── socket.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── index.html
│   ├── package.json
│   ├── .env.example
│   └── vite.config.js
│
├── server/
│   ├── config/
│   │   └── cloudinary.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
└── README.md
```

---

## 🧰 Tech Stack

### Frontend
- **React 19**
- **Vite**
- **React Router**
- **Socket.IO Client**
- **WebRTC API**
- **Framer Motion**
- **Lucide React**
- **Tailwind CSS**
- **html2canvas**
- **canvas-confetti**

### Backend
- **Node.js**
- **Express**
- **Socket.IO**
- **MongoDB / Mongoose**
- **Cloudinary SDK**
- **Helmet**
- **express-rate-limit**
- **CORS**

### Infrastructure
- **Render Static Sites** (Frontend SPA)
- **Render Web Services** (Backend Node API + Socket.IO)
- **MongoDB Atlas** (Database)
- **Cloudinary** (Media storage & CDN)

---

## 🚀 Local Development

### 1. Clone the repository
```bash
git clone https://github.com/ayushgoyal-18/online-photobooth.git
cd online-photobooth
```

### 2. Install dependencies
```bash
# Frontend
cd client
npm install

# Backend
cd ../server
npm install
```

### 3. Configure backend environment variables
Create `server/.env`:
```env
NODE_ENV=development
PORT=5000

MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>

CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>

ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```

### 4. Configure frontend environment variables
Create `client/.env`:
```env
VITE_SERVER_URL=http://localhost:5000
```
*(Do not put server secrets in `client/.env`. Anything prefixed with `VITE_` is exposed to the browser.)*

### 5. Start the backend
```bash
cd server
npm start
```
*Check health endpoint: `http://localhost:5000/health`*

### 6. Start the frontend
In a second terminal:
```bash
cd client
npm run dev
```
*Open in browser: `http://localhost:5173`*

---

## 🌐 Production Deployment on Render

Framoji is configured for seamless deployment on Render across two services:

### Backend — Render Web Service
- **Root Directory:** `server`
- **Runtime:** `Node`
- **Build Command:** `npm ci`
- **Start Command:** `npm start`
- **Health Check Path:** `/health`

**Environment Variables:**
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
ALLOWED_ORIGINS=https://framoji-frontend.onrender.com
```

### Frontend — Render Static Site
- **Root Directory:** `client`
- **Build Command:** `npm ci && npm run build`
- **Publish Directory:** `dist`

**Environment Variables:**
```env
VITE_SERVER_URL=https://framoji-backend.onrender.com
```

**SPA Routing Rewrite (`client/public/_redirects`):**
```
/* /index.html 200
```
This ensures direct navigation and QR scanning for `/room/:roomId` and `/strip/:stripId` route smoothly through React Router.

---

## 🔐 Security

Framoji incorporates defensive best practices across the full stack:
- **HTTP Hardening:** Helmet security headers, `x-powered-by` disabled, strict CORS allowlisting, body size limits.
- **Rate Limiting:** `express-rate-limit` safeguards API endpoints and photostrip creation against abuse.
- **Socket Isolation:** Validates room IDs, participant membership, host privileges, and frame payloads.
- **Reconnection Tokens:** Server-issued `hostToken` and `guestToken` authenticate reconnecting peers.
- **Secret Isolation:** Cloudinary API secrets and database connection strings remain strictly server-side.

---

## ⚠️ WebRTC & Production Notes

- **WebRTC Peer Discovery:** Framoji uses public STUN servers for WebRTC peer discovery without requiring a TURN relay for the MVP. Restrictive corporate firewalls or symmetric NATs may occasionally prevent P2P media connections.
- **In-Memory Room State:** Active room state resides in server memory for low latency. For high-availability multi-instance scaling, room sessions can be moved to Redis.
- **Render Cold Starts:** Free-tier instances may experience initial spin-up latency on first visit.

---

## 🧪 Verification Checklist

- [x] **Camera Orientation:** Default camera opens in Real View; toggle switches cleanly to Mirror View; captured photos preserve the exact orientation selected.
- [x] **Booth Session QR:** Generates `/room/:roomId` link; scans directly into the active session without 404.
- [x] **Saved Photostrip QR:** Generates `/strip/:stripId` link; scans directly to the dedicated Photostrip view.
- [x] **Cloud Persistence:** Strip metadata saves to MongoDB Atlas; image uploads to Cloudinary.
- [x] **Multi-Participant Sync:** Countdowns, camera feeds, and frame aggregation synchronize across peers.
- [x] **Customization:** Filters, captions, layouts, and draggable stickers render accurately.
- [x] **Download & Clipboard:** Direct PNG download and clipboard copy functions work across devices.

---

## 🛠️ Future Improvements

- ⚡ Redis-backed distributed room state
- 🧪 Automated E2E test suite (Playwright)
- 📐 TypeScript migration & Zod schema validation
- 📊 Error tracking integration (Sentry)
- 📱 Progressive Web App (PWA) installation

---

## 📜 License

This project is currently provided for educational and portfolio purposes.

---

## 👨‍💻 Project Status

Framoji is a deployed full-stack real-time photobooth MVP.

The application is deployed using Render, with MongoDB Atlas for persistent photostrip metadata and Cloudinary for image storage.