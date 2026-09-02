Framoji 🎞️

One memory. Any distance.

## ⚠️ WebRTC Connectivity Note

Framoji currently uses public STUN servers for WebRTC peer discovery. No TURN server is required for the current MVP deployment.

Because TURN is not used, some users behind restrictive corporate firewalls, VPNs, or symmetric NAT configurations may be unable to establish a direct peer-to-peer connection. For the best experience, use a modern browser on standard residential or mobile connections with camera and microphone permissions enabled.

---

Framoji is a real-time virtual photobooth that lets people take synchronized photos together even when they are in different locations. Participants join a shared booth, connect their cameras through WebRTC, capture synchronized shots, review them, customize the final photostrip, and save/share the result.

✨ Features

🎥 Real-time camera sharing with WebRTC

👥 Solo, Couple, and Friends/Group booth modes

⏱️ Synchronized countdown and photo capture

🖼️ Multi-participant frame aggregation

🔄 Room/session recovery after reconnects

🎞️ Photostrip review and retake flow

🎨 Filters, captions, layouts, and stickers

📥 PNG photostrip download

📋 Copy photostrip image to clipboard

📱 QR/mobile sharing

☁️ Server-side Cloudinary storage

🗄️ MongoDB persistence for saved photostrips

🛡️ Helmet, CORS allowlisting, rate limiting, input validation

♿ Basic accessibility support for dialogs, labels, keyboard interaction, and reduced motion

📱 Responsive camera and photostrip UI

🏗️ Architecture

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

Browser ↔ Browser media:
        WebRTC peer-to-peer video/audio

Main flow

Host creates a booth.

Server creates and stores the room configuration.

Guests open the room link and enter their names.

Browser camera permissions are requested.

WebRTC establishes peer-to-peer camera connections.

Host starts the synchronized countdown.

Each participant captures a local frame.

Frames are submitted to the server and aggregated.

All participants receive the merged preview.

Host accepts/retakes each shot.

After all shots are accepted, the host generates the photostrip.

The final strip can be customized and downloaded.

The final image can be stored through the server-side Cloudinary pipeline.

📁 Project Structure

online-photobooth/
│
├── client/
│   ├── public/
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

🧰 Tech Stack

Frontend

React 19

Vite

React Router

Socket.IO Client

WebRTC

Framer Motion

Lucide React

Tailwind CSS

html2canvas

canvas-confetti

Backend

Node.js

Express

Socket.IO

MongoDB / Mongoose

Cloudinary

Helmet

express-rate-limit

CORS

Infrastructure

GitHub

Render

MongoDB Atlas

Cloudinary

🚀 Local Development

1. Clone the repository

git clone <YOUR_GITHUB_REPOSITORY_URL>
cd online-photobooth

2. Install frontend dependencies

cd client
npm install

3. Install backend dependencies

cd ../server
npm install

4. Configure backend environment variables

Create:

server/.env

Example:

NODE_ENV=development
PORT=5000

MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>

CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>

ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

5. Configure frontend environment variables

Create:

client/.env

Example:

VITE_SERVER_URL=http://localhost:5000

Do not put server secrets in client/.env.

Anything beginning with VITE_ is exposed to the browser.

6. Start the backend

cd server
npm start

Expected:

Framoji server on port 5000

Check:

http://localhost:5000/health

7. Start the frontend

In another terminal:

cd client
npm run dev

Open:

http://localhost:5173

🔐 Security

Framoji uses several layers of protection.

HTTP security

Helmet security headers

x-powered-by disabled

Explicit CORS allowlist in production

JSON body-size limits

REST API rate limiting

Socket security

Room operations validate:

room IDs

participant membership

host permissions

photo indexes

frame size and data format

countdown permissions

WebRTC signaling is only relayed between registered room participants.

Reconnection authentication

Room reconnection should use server-issued tokens:

hostToken
guestToken

Tokens are stored locally by the client and must never be hard-coded or committed to Git.

Image security

Photostrips are uploaded through the backend to Cloudinary.

The Cloudinary API secret must remain server-side.

🌐 Production Deployment on Render

Framoji consists of two deployable parts:

Frontend: Render Static Site

Backend: Render Web Service

Render supports React/Vite static sites through its Static Site service and Node/Express applications through Web Services. Client-side React Router routes need a rewrite to /index.html.

Backend — Render Web Service

Create a new Web Service.

Recommended settings:

Root Directory: server
Runtime: Node
Build Command: npm ci
Start Command: npm start
Health Check Path: /health

Render requires the Node service to listen on the platform-provided port. The server uses:

const PORT = process.env.PORT || 5000;

Add these Render environment variables:

NODE_ENV=production
MONGODB_URI=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
ALLOWED_ORIGINS=https://<your-frontend>.onrender.com

Never commit these values to GitHub.

Render web services can be configured directly from a connected Git repository and automatically redeployed when the tracked branch changes.

Frontend — Render Static Site

Create a new Static Site.

Recommended settings:

Root Directory: client
Build Command: npm ci && npm run build
Publish Directory: dist

Add:

VITE_SERVER_URL=https://<your-backend>.onrender.com

Then add a Render rewrite:

Source: /*
Destination: /index.html
Action: Rewrite

This is required so direct navigation to routes such as:

/room/ABC123
/strip/ABC123
/join
/create

continues to work after deployment.

🔑 Environment Variable Rules

Safe in frontend

VITE_SERVER_URL=https://api.example.com

Never expose in frontend

MONGODB_URI
CLOUDINARY_API_SECRET
Only variables intentionally prefixed with VITE_ should be considered public browser configuration.

🧪 Verification Checklist

Before pushing to GitHub:

Frontend

cd client
npm install
npm run lint
npm run build

Backend

cd server
npm install
node -c server.js
npm start

Functional tests

Home page loads

Create Solo booth

Create Couple booth

Create Friends booth with 3 participants

Create Friends booth with 4–6 participants

Guest camera preview appears before joining

Guest camera appears after joining

Host camera appears

Remote cameras appear

Microphone toggle works

Camera toggle works

Camera switching works

Countdown synchronizes

All participants submit frames

Frames aggregate correctly

Host can accept a shot

Host can retake a shot

All photos reach review

Guest sees read-only review

Host generates photostrip

Guest receives photostrip

Photostrip does not crash

Download works

Copy image works

QR share works

New booth works

Refresh during a room works

Refresh during strip phase restores strip

Room expires correctly after host timeout

Invalid room IDs are rejected

Unauthorized host reconnection is rejected

Duplicate names are rejected

Room capacity is enforced

Photostrip API rejects oversized/invalid input

📊 Performance

Important optimizations:

Route-level lazy loading

Dynamic loading of html2canvas

Dynamic loading of canvas-confetti

WebRTC peer-to-peer media instead of routing video through the server

Limited frame dimensions before network submission

API rate limiting

CDN delivery for frontend assets through Render Static Sites

Avoid loading large image-generation libraries on the initial page whenever possible.

♿ Accessibility

The application should provide:

semantic buttons

associated form labels

keyboard-accessible controls

visible focus states

dialog semantics

descriptive image alt text

reduced-motion support

Camera and photobooth interfaces should remain usable on small screens and with reduced motion enabled.

🧭 Recommended Production Architecture

For a small production deployment:

Render Static Site
        │
        │ HTTPS / WSS
        ▼
Render Node Web Service
        │
        ├── MongoDB Atlas
        │
        └── Cloudinary



⚠️ Important Production Limitations

In-memory rooms

Room state currently lives in server memory.

This means a server restart can remove active rooms.

For a single Render instance this is acceptable for a student/MVP deployment, but it is not a horizontally scalable architecture.

For multi-instance production, move room/session state to Redis or another shared store.

Render free-tier cold starts

Free Render web services can spin down after inactivity and start again when traffic arrives. This can affect the first connection latency.

Photostrip privacy

Photostrips stored on Cloudinary are accessible through their stored URL. If private memories are a requirement, implement signed/private delivery and an access-control model rather than exposing permanent public image URLs.

🛠️ Future Improvements

Redis-backed room state

Automated E2E tests with Playwright

TypeScript migration

Zod schema validation

Structured logging

Error monitoring with Sentry

CSP tuning

Automated dependency/security scanning

Better mobile camera controls

PWA/offline support

Private photostrip sharing

Automatic photostrip expiry/deletion

User accounts and session management

📜 License

Add your preferred license before publishing publicly.

For a college/project submission, MIT is a simple option if you want the code to be openly reusable.

👨‍💻 Project Status

Framoji is a full-stack real-time photobooth MVP approaching production deployment.

Before public deployment, complete the final security and functional verification checklist above and ensure the GitHub repository contains only the intended production code and no secrets.