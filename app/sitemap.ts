import { type MetadataRoute } from 'next';
import { createClient } from '@/db/supabase/client';
import { locales } from '@/i18n';

import { BASE_URL } from '@/lib/env';

async function fetchCategories() {
  const supabase = createClient();
  const { data, error } = await supabase.from('navigation_category').select('name');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  return data;
}

async function fetchWebsites() {
  const supabase = createClient();
  const { data, error } = await supabase.from('web_navigation').select('name');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  return data;
}

function encodeURL(url: string): string {
  return encodeURI(url).replace(/&/g, '&amp;');
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitemapRoutes = [
    {
      url: '', // home
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: '', // home
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: 'explore',
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: 'submit',
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: 'startup',
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: 'privacy-policy',
      lastModified: new Date().toISOString(),
      changeFrequency: 'yearly' as const,
      priority: 0.8,
    },
    {
      url: 'terms-of-service',
      lastModified: new Date().toISOString(),
      changeFrequency: 'yearly' as const,
      priority: 0.8,
    },
  ];

  const categories = await fetchCategories();

  const categorySitemapRoutes = categories.map((category) => ({
    url: `category/${category.name}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const websites = await fetchWebsites();
  const websiteSitemapRoutes = websites.map((website) => ({
    url: `ai/${website.name}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }));

  const allRoutes = [...sitemapRoutes, ...categorySitemapRoutes, ...websiteSitemapRoutes];

  const sitemapData = allRoutes.flatMap((route) =>
    locales.map((locale) => {
      const lang = locale === 'en' ? '/en' : `/${locale}`;
      const routeUrl = route.url === '' ? '' : `/${route.url}`;
      return {
        ...route,
        url: encodeURL(`${BASE_URL}${lang}${routeUrl}`),
      };
    }),
  );

  return sitemapData;
}
