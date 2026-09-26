# Framoji 🎞️

### One memory. Any distance.

A real-time virtual photobooth web application that allows friends, couples, and groups in different locations to capture synchronized photos, customize beautiful vintage photostrips, and share memories instantly.

🌐 **Live Application:** [https://framoji-frontend.onrender.com](https://framoji-frontend.onrender.com)  
💻 **GitHub Repository:** [https://github.com/ayushgoyal-18/online-photobooth](https://github.com/ayushgoyal-18/online-photobooth)

---

## ✨ Features & Capabilities

### 🎥 Live Virtual Photobooth
- **Peer-to-Peer WebRTC Video:** Low-latency video and audio streaming directly between participants using WebRTC mesh topology with STUN server discovery.
- **Real View vs. Mirror View:** Toggle between natural, unmirrored camera capture (Real View by default) and mirrored camera feed, preserved accurately in final photo exports.
- **Multiple Booth Modes:** 
  - 👤 **Solo:** Single-user photobooth experience with customizable layouts.
  - 💑 **Couple / Duo:** 2-person synchronized split-frame booth.
  - 👥 **Friends & Group:** Multi-user booth with dynamic grid aggregation.
- **Camera Device Switching:** Seamless toggle between front and rear cameras on mobile devices, plus quick mic/video mute controls.

### ⏱️ Synchronized Orchestration
- **Host-Controlled Countdown:** 3-second synchronized visual and audio countdown across all connected peers.
- **Multi-Frame Compositing:** Each participant captures a high-resolution local frame simultaneously, which is aggregated into a unified composite photo on the server.
- **Review & Retake Flow:** Step-by-step review allows the host to approve or retake individual shots before generating the final strip.
- **Session Resilience & Reconnection:** Built-in cryptographic host/guest token authentication and state recovery allow seamless reconnection after browser refresh or transient network drops.

### 🎨 Photostrip Customization & Design
- **Retro & Modern Layouts:** Classic 4-photo vertical strips, 2-photo strips, 3-photo strips, 6-photo strips, wide grid formats, and filmstrip borders with sprocket holes.
- **Aesthetic Color Filters:** Original, Warm Vintage, Classic B&W, Sepia Grain, Film Noir, Cyber Neon, Soft Pastel, and Cool Breeze.
- **Interactive Sticker Editor:** Drag, scale, rotate, and delete emojis and themed stickers across the photostrip.
- **Custom Typography & Captions:** Add personalized date stamps, captions, and names.

### 💾 Export, Cloud Storage & Sharing
- **Revision-Aware Autosave Loop:** Non-blocking, dirty-state aware background saving that uploads the latest revision to Cloudinary and MongoDB without race conditions.
- **Cross-Origin Safe Download:** High-res PNG export with resilient cross-origin Blob handling.
- **Clipboard Image Copy:** One-click copy of the final photostrip PNG directly to the system clipboard.
- **Dual Dynamic QR Codes:**
  - 🔗 **Booth Join QR (`/room/:roomId`):** Lets guests scan with mobile phones to instantly join the live booth session.
  - 📱 **Saved Photostrip QR (`/strip/:stripId`):** Generates a mobile-ready link to view, download, and share the cloud-stored strip.
- **Dedicated Public View (`/strip/:stripId`):** Standalone, responsive photostrip viewer with native Web Share API support.
- **Local Gallery Drawer:** Fast client-side session history saved to browser `localStorage`.

### 🛡️ Security & Privacy
- **Hardened HTTP:** Helmet security headers, `X-Powered-By` disabled, strict CORS allowlisting with local network dev support, and JSON body limits.
- **Granular Rate Limiting:** Endpoint-specific limits for general API requests, photostrip generation, and analytics submissions.
- **Cryptographic Edit Tokens:** Photostrip updates require matching SHA-256 hashed edit tokens to prevent unauthorized modifications.
- **Protected Admin Analytics:** Privacy-friendly, cookie-less event tracking with 90-day TTL expiry and admin-key protected metrics endpoint (`/api/analytics/stats`).

---

## 🏗️ Architecture & Data Flow

```
                                  ┌────────────────────────┐
                                  │   Client SPA (React)   │
                                  │ Vite · Router · WebRTC │
                                  └───────────┬────────────┘
                                              │
                              ┌───────────────┴───────────────┐
                  WebRTC (P2P)│                               │ Socket.IO + REST
                              ▼                               ▼
                 ┌─────────────────────────┐     ┌─────────────────────────┐
                 │   Peer WebRTC Client    │     │  Express + Socket.IO    │
                 │  Direct Media Streaming │     │    Node.js Server       │
                 └─────────────────────────┘     └────────────┬────────────┘
                                                              │
                                            ┌─────────────────┴─────────────────┐
                                            ▼                                   ▼
                                 ┌────────────────────┐              ┌────────────────────┐
                                 │   MongoDB Atlas    │              │  Cloudinary CDN    │
                                 │ Metadata & Events  │              │ Photostrip Images  │
                                 └────────────────────┘              └────────────────────┘
```

### End-to-End Workflow

1. **Booth Creation:** Host selects mode, participant names, theme, and layout on [CreateBooth.jsx](file:///c:/Users/Ayush%20Goyal/Desktop/online-photobooth/client/src/pages/CreateBooth.jsx).
2. **Signaling & Connection:** Guests join via link or QR code ([JoinBooth.jsx](file:///c:/Users/Ayush%20Goyal/Desktop/online-photobooth/client/src/pages/JoinBooth.jsx)). WebRTC peer connections are negotiated via Socket.IO signaling.
3. **Synchronized Capture:** Host triggers the countdown. All clients simultaneously capture high-resolution frames with selected mirror/real orientation.
4. **Frame Review:** Server merges individual participant frames into a composite shot. The host reviews and either accepts or retakes each shot.
5. **Customization & Auto-Sync:** Participants edit filters, captions, and stickers. The client-side revision loop renders the photostrip via `html2canvas` and syncs to `/api/photostrips`.
6. **Cloud Persistence:** Backend uploads the rendered image to Cloudinary and persists metadata in MongoDB Atlas.
7. **Instant Sharing:** Participants download high-res PNGs, copy images to clipboard, or scan the `/strip/:stripId` QR code for instant mobile viewing.

---

## 📁 Project Structure

```
online-photobooth/
│
├── client/                                  # React SPA Frontend (Vite)
│   ├── public/
│   │   ├── _redirects                       # Render SPA rewrite rule (/* /index.html 200)
│   │   ├── apple-touch-icon.png             # Apple iOS home screen touch icon
│   │   ├── og-image.png                     # OpenGraph preview banner image
│   │   ├── robots.txt                       # Search engine crawler instructions
│   │   └── sitemap.xml                      # XML Sitemap for SEO indexing
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── Countdown.jsx                # Visual & audio countdown overlay
│   │   │   ├── ErrorBoundary.jsx            # React Error Boundary crash protector
│   │   │   ├── FilterSelector.jsx           # Real-time CSS canvas filter picker
│   │   │   ├── LegalModal.jsx               # Terms, Privacy & Cookies dialog modal
│   │   │   ├── PhotoPreview.jsx             # Live multi-peer composite review
│   │   │   ├── PhotoReview.jsx              # Host accept / retake review step
│   │   │   ├── Photostrip.jsx               # Photostrip DOM canvas & frame renderer
│   │   │   └── StickerEditor.jsx            # Draggable, scalable emoji sticker editor
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.jsx                     # Landing page with interactive preview & gallery
│   │   │   ├── CreateBooth.jsx              # Multi-step booth wizard
│   │   │   ├── JoinBooth.jsx                # Room code entry screen
│   │   │   ├── Room.jsx                     # Core WebRTC room & photobooth engine
│   │   │   ├── PhotostripView.jsx           # Standalone public photostrip viewer (/strip/:id)
│   │   │   └── NotFound.jsx                 # 404 error page with quick navigation
│   │   │
│   │   ├── utils/
│   │   │   ├── analytics.js                 # Privacy-first client event tracker
│   │   │   └── download.js                  # Cross-origin image download utility
│   │   │
│   │   ├── App.jsx                          # Main routing & layout component
│   │   ├── index.css                        # Design system tokens & base typography
│   │   ├── main.jsx                         # React entry point
│   │   └── socket.jsx                       # Socket.IO client singleton
│   │
│   ├── index.html                           # HTML template with metadata & fonts
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
├── server/                                  # Express & Socket.IO Backend
│   ├── config/
│   │   └── cloudinary.js                    # Cloudinary SDK client configuration
│   │
│   ├── server.js                            # Express API, MongoDB models & Socket server
│   ├── package.json
│   └── .env.example
│
└── README.md
```

---

## 🧰 Tech Stack

### Frontend
- **Framework:** React 19, Vite
- **Routing:** React Router v7
- **Real-Time Communication:** Socket.IO Client, WebRTC API
- **Animations & Icons:** Framer Motion, Lucide React, Canvas Confetti
- **Image Generation & QR:** `html2canvas`, `qrcode`
- **Styling:** Vanilla CSS design tokens with Aurora gradients & glassmorphism

### Backend
- **Runtime:** Node.js, Express
- **WebSockets:** Socket.IO
- **Database:** MongoDB Atlas with Mongoose ODM
- **Media Storage:** Cloudinary SDK & CDN
- **Security & Utilities:** Helmet, CORS, `express-rate-limit`, Crypto

### Infrastructure & Deployment
- **Frontend Hosting:** Render Static Sites
- **Backend Hosting:** Render Web Services
- **Database:** MongoDB Atlas (M0 / Serverless)
- **CDN & Storage:** Cloudinary Media Cloud

---

## 🔌 API & Socket Reference

### REST Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Server & MongoDB connection health check |
| `POST` | `/api/photostrips` | Rate-limited | Uploads rendered photostrip image to Cloudinary & saves metadata to MongoDB |
| `GET` | `/api/photostrips/:stripId` | Public | Retrieves photostrip metadata and Cloudinary URL |
| `GET` | `/api/ice-servers` | Public | Returns STUN servers for WebRTC peer connection |
| `GET` | `/api/network-info` | Dev Only | Returns local network IP for testing mobile devices on local WiFi |
| `POST` | `/api/analytics/event` | Rate-limited | Records privacy-friendly client event (90-day TTL) |
| `GET` | `/api/analytics/stats` | Admin Header | Aggregated analytics metrics (requires `X-Admin-Key` header) |

### Key Socket.IO Events

| Event | Direction | Payload / Purpose |
|---|---|---|
| `create-room` | Client → Server | Initializes a new room session with theme, mode, and participant configuration |
| `join-room` | Client → Server | Validates room capacity, registers participant, and assigns host/guest tokens |
| `peers-updated` | Server → Client | Broadcasts sanitized list of connected participants (`id`, `name`, `isHost`) |
| `signal-offer` / `signal-answer` | Bidirectional | Relays WebRTC SDP descriptions between peers |
| `signal-ice` | Bidirectional | Relays WebRTC ICE candidates with client-side queue buffering |
| `start-countdown` | Host → Server | Broadcasts synchronized 3-second countdown to all room members |
| `submit-photo` | Client → Server | Submits individual participant camera frame for server aggregation |
| `photo-captured` | Server → Client | Broadcasts aggregated composite preview to all room members |
| `accept-photo` / `retake-photo` | Host → Server | Advances photobooth sequence or retakes the current shot |
| `all-photos-complete` | Server → Client | Signals transition from capture phase to photostrip customizer |

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **MongoDB Atlas** account (or local MongoDB instance)
- **Cloudinary** account

### 2. Clone the Repository
```bash
git clone https://github.com/ayushgoyal-18/online-photobooth.git
cd online-photobooth
```

### 3. Backend Setup
```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:
```env
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/framoji?retryWrites=true&w=majority

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Allowed CORS Origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

# Analytics Protection (optional for dev)
ANALYTICS_ADMIN_KEY=your_secure_admin_key
```

Start the backend server:
```bash
npm start
```
*Verify backend health: `http://localhost:5000/health`*

### 4. Frontend Setup
In a new terminal window:
```bash
cd client
npm install
```

Create a `.env` file in the `client/` directory:
```env
VITE_SERVER_URL=http://localhost:5000
```

Start the Vite development server:
```bash
npm run dev
```
*Open in your browser: `http://localhost:5173`*

---

## 🌐 Production Deployment on Render

Framoji is configured for continuous zero-config deployment on Render.

### 1. Backend Web Service
- **Environment:** `Node`
- **Root Directory:** `server`
- **Build Command:** `npm ci`
- **Start Command:** `npm start`
- **Health Check Path:** `/health`
- **Environment Variables:**
  ```env
  NODE_ENV=production
  MONGODB_URI=mongodb+srv://...
  CLOUDINARY_CLOUD_NAME=...
  CLOUDINARY_API_KEY=...
  CLOUDINARY_API_SECRET=...
  ALLOWED_ORIGINS=https://framoji-frontend.onrender.com
  ANALYTICS_ADMIN_KEY=your_production_admin_key
  ```

### 2. Frontend Static Site
- **Environment:** `Static Site`
- **Root Directory:** `client`
- **Build Command:** `npm ci && npm run build`
- **Publish Directory:** `dist`
- **Environment Variables:**
  ```env
  VITE_SERVER_URL=https://framoji-backend.onrender.com
  ```
- **SPA Redirect Support:** The `client/public/_redirects` file automatically redirects all subpaths (`/* /index.html 200`) so direct QR navigation to `/room/:id` and `/strip/:id` works seamlessly.

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).