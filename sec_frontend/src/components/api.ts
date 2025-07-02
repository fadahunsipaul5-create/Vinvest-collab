const baseUrl =
  window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : 'https://sec-insights-backend-791634680391.us-central1.run.app';

console.log('Using baseUrl:', baseUrl);
export default baseUrl;