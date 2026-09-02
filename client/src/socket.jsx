import { io } from "socket.io-client";

const URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

const socket = io(URL, {
  transports: ["websocket", "polling"],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

socket.on("connect_error", (err) => {
  console.error("[framoji] Socket error:", err.message);
});

export default socket;