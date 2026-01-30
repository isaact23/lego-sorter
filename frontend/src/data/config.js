// Environment configuration
// Use REACT_APP_BACKEND_URL from .env file
// Defaults to localhost:3000 if not specified

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://10.10.10.121:3000'
const API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT || 'https://api.brickognize.com/predict/'

export { BACKEND_URL, API_ENDPOINT }
