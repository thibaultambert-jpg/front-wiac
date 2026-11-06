import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sanitize-html dépend de modules Node : on le laisse hors du bundle serveur.
  serverExternalPackages: ["sanitize-html"],
};

export default nextConfig;
