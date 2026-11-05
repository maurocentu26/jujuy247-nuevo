import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import ArticleEditor from '../../components/ArticleEditor';
import { getDirectusUrl, getValidToken } from '../../../../lib/panel-auth';

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Editar Noticia #${id} | Panel Jujuy247`,
  };
}

export default async function EditarNoticiaPage({ params }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const { token } = await getValidToken(cookieStore, { refresh: false });

  if (!token) {
    return null; // The dashboard layout renews the session before rendering this page.
  }

  const fields = [
    'id',
    'title',
    'slug',
    'excerpt',
    'content',
    'front_page',
    'published_at',
    'status',
    'seo_title',
    'seo_description',
    'cover_image',
    'youtube_url',
    'category.id',
    'category.name',
  ].join(',');

  try {
    const directusUrl = getDirectusUrl(`/items/articles/${id}?fields=${encodeURIComponent(fields)}`);
    const res = await fetch(directusUrl, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      notFound();
    }

    const json = await res.json();
    const article = json?.data;

    if (!article) {
      notFound();
    }

    return <ArticleEditor initialArticle={article} />;
  } catch {
    notFound();
  }
}
