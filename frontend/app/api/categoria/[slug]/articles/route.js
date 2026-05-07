import { NextResponse } from 'next/server';
import { getLatestArticles, getCategoryBySlug } from '../../../../../lib/directus';

export async function GET(request, { params }) {
  const { slug } = await Promise.resolve(params);
  const category = await getCategoryBySlug(slug).catch(() => null);
  if (!category) {
    return NextResponse.json({ articles: [], hasMore: false, nextOffset: 0 }, { status: 404 });
  }

  const url = new URL(request.url);
  const offset = Math.max(0, Number(url.searchParams.get('offset') || 0) || 0);
  const limit = Math.min(20, Math.max(1, Number(url.searchParams.get('limit') || 10) || 10));

  const articles = await getLatestArticles({ categorySlug: category.slug, offset, limit: limit + 1 }).catch(() => []);
  const hasMore = articles.length > limit;
  const trimmedArticles = hasMore ? articles.slice(0, limit) : articles;

  return NextResponse.json({
    articles: trimmedArticles,
    hasMore,
    nextOffset: offset + trimmedArticles.length,
  });
}
