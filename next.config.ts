import type { NextConfig } from "next";

// sanitize-html est volontairement embarqué dans le bundle serveur : chargé en externe,
// son require() de htmlparser2 (100 % ESM) échoue sur le runtime Vercel.
const nextConfig: NextConfig = {};

export default nextConfig;
