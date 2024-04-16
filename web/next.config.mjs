const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/",
        destination: "/web",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
