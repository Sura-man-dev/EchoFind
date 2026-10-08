/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: new URL(process.env.IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io").hostname,
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
