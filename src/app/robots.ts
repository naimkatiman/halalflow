import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/workflows', '/templates', '/settings', '/onboarding', '/invites'],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
