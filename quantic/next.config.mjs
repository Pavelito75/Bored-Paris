/** @type {import('next').NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS === "true";
const repoName = process.env.NEXT_PUBLIC_REPO_NAME || "";
const isUserPage = repoName.endsWith(".github.io");
const basePath = isGithubActions && repoName && !isUserPage ? `/${repoName}` : "";

const nextConfig = {
  // Static export only in GitHub Actions deployment
  ...(isGithubActions ? { output: "export" } : {}),
  basePath: basePath,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
