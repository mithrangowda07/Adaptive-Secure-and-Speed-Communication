import { io } from "socket.io-client";

const getBackendUrl = () => {
  if (import.meta.env.VITE_BACKEND_URL) return import.meta.env.VITE_BACKEND_URL;
  // Dynamically resolve backend host using the current page's hostname
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:5000`;
};

const socket = io(getBackendUrl(), {
  autoConnect: true
});

export default socket;
