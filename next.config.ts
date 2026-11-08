import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 세션 쿠키를 읽는 동적 페이지 위주의 앱이라 Cache Components는 쓰지 않아요.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
