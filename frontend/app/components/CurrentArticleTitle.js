'use client';

import { useEffect } from 'react';

const EVENT_NAME = 'jujuy247:article-title';

export default function CurrentArticleTitle({ title }) {
  useEffect(() => {
    const safeTitle = typeof title === 'string' ? title : '';

    document.documentElement.dataset.currentArticleTitle = safeTitle;
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { title: safeTitle } }));

    return () => {
      delete document.documentElement.dataset.currentArticleTitle;
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { title: '' } }));
    };
  }, [title]);

  return null;
}
