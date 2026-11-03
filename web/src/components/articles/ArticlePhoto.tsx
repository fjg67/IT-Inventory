import { memo, useEffect, useState } from 'react';
import { MiniIcon } from '../../pages/DashboardPage';

interface ArticlePhotoProps {
  name: string;
  imageUrl?: string | null;
  onPreview: (name: string, url: string) => void;
}

export const ArticlePhoto = memo(function ArticlePhoto({ name, imageUrl, onPreview }: ArticlePhotoProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const trimmedUrl = imageUrl?.trim();
  const src = trimmedUrl && trimmedUrl.toLowerCase() !== 'null' ? trimmedUrl : null;

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  if (src && !failed) {
    return (
      <button
        className={`article-photo-button${loaded ? ' is-loaded' : ' is-loading'}`}
        type="button"
        aria-label={`Agrandir la photo de ${name}`}
        onClick={() => onPreview(name, src)}
      >
        <span className="article-photo">
          <img
            src={src}
            alt={`Photo de ${name}`}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        </span>
      </button>
    );
  }

  const label = failed
    ? `Photo indisponible pour ${name}`
    : imageUrl === undefined
      ? `Photo non fournie par le service pour ${name}`
      : `Aucune photo pour ${name}`;
  return (
    <span className="article-photo article-photo--empty" role="img" aria-label={label} title={label}>
      <MiniIcon name="box" />
    </span>
  );
});
