/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // This allows the client to access the API key if you set it in Vercel/System env
    // For now, we keep the existing logic where user sets it in window, 
    // but in production you would use process.env.API_KEY here.
  }
};

export default nextConfig;