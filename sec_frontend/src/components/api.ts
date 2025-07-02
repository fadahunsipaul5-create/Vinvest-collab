const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://sec-insights-backend-791634680391.us-central1.run.app';
export default baseUrl;
const baseUrl2 = 'http://localhost:8000';   
console.log("Using baseUrl:", baseUrl);
console.log("Using baseUrl2:", baseUrl2);

export { baseUrl2 };
