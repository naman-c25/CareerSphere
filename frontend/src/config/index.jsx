import axios from "axios";

const clientServer = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090",
});

export { clientServer };
