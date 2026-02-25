import axios from "axios";

const clientServer = axios.create({
  baseURL: "https://careersphere-354l.onrender.com" || "http://localhost:9090",
});

export { clientServer };
