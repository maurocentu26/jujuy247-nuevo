import Image from 'next/image';
import Link from 'next/link';
import { directusAssetUrl, getDirectusFileId } from '../../../lib/directus';
import { formatPublishedAt, formatRelativePublishedAt, parsePublishedAt } from '../../../lib/datetime';
import { focalPosition } from '../../../lib/article-layout.mjs';

function cleanName(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function StoryTime({ value, relative = false }) {
  if (!value) return null;
  const date = parsePublishedAt(value);
  const label = relative ? formatRelativePublishedAt(value) || formatPublishedAt(value) : formatPublishedAt(value);
  return <time dateTime={date?.toISOString()}>{label}</time>;
}

function StoryPhoto({ article, sizes }) {
  const fileId = getDirectusFileId(article.cover_image);
  if (!fileId) return <span className="story-photo story-photo-empty" aria-hidden="true" />;
  return (
    <span className="story-photo">
      <Image
        src={directusAssetUrl(fileId)}
        alt=""
        fill
        sizes={sizes}
        style={{ objectPosition: focalPosition(article.cover_image) }}
      />
    </span>
  );
}

// variant: "next" (featured, image beside text), "card" (image on top),
// "row" (small image beside a headline), "rank" (numbered, text only),
// "opinion" (text only, quote styling), "inline" (inside the article body).
export default function StoryCard({ article, variant = 'card', index, showCategory = true, showExcerpt = false }) {
  const href = `/noticias/${encodeURIComponent(article.slug)}`;
  const category = cleanName(article.category?.name);
  const excerpt = showExcerpt ? cleanName(article.excerpt) : '';
  const withPhoto = variant === 'next' || variant === 'card' || variant === 'row' || variant === 'inline';
  const sizes = {
    next: '(max-width: 700px) 100vw, 360px',
    card: '(max-width: 700px) 78vw, 260px',
    row: '96px',
    inline: '120px',
  }[variant];

  return (
    <Link href={href} className={`story story-${variant}`}>
      {variant === 'rank' && index != null ? <span className="story-rank-num" aria-hidden="true">{index + 1}</span> : null}
      {withPhoto ? <StoryPhoto article={article} sizes={sizes} /> : null}
      <span className="story-body">
        {variant === 'inline' ? <span className="story-kicker">Leé también</span> : null}
        {showCategory && category && variant !== 'inline' ? <span className="story-kicker">{category}</span> : null}
        <span className="story-title">{cleanName(article.title)}</span>
        {excerpt ? <span className="story-excerpt">{excerpt}</span> : null}
        {variant !== 'inline' ? (
          <span className="story-time">
            <StoryTime value={article.published_at} relative={variant === 'rank' || variant === 'row'} />
          </span>
        ) : null}
      </span>
    </Link>
  );
}
