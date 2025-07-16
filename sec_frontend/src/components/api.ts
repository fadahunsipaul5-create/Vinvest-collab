// Use local backend for development, production backend for production
const baseUrl = import.meta.env.DEV 
  ? 'http://127.0.0.1:8000' 
  : 'https://sec-insights-backend-791634680391.us-central1.run.app'

export default baseUrl;
console.log("Using baseUrl:", baseUrl);
