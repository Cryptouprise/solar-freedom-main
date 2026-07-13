import React, { useState } from "react";

const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{6,20}$/;

export function buildPrivacyEnhancedYouTubeUrl(videoId: string): string {
  if (!YOUTUBE_VIDEO_ID.test(videoId)) {
    throw new Error("Invalid YouTube video ID");
  }

  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
}

type PrivacyVideoEmbedProps = {
  videoId: string;
  title: string;
  accent?: "amber" | "blue";
};

/**
 * Click-to-load player. The initial render contains no YouTube image, iframe,
 * script, or URL, so visiting the page alone does not contact YouTube.
 */
export default function PrivacyVideoEmbed({
  videoId,
  title,
  accent = "amber",
}: PrivacyVideoEmbedProps) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <iframe
        src={buildPrivacyEnhancedYouTubeUrl(videoId)}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        className="absolute inset-0 h-full w-full border-0"
        data-privacy-enhanced-video="youtube"
      />
    );
  }

  const buttonColor = accent === "blue"
    ? "bg-blue-500 text-white hover:bg-blue-400"
    : "bg-amber-400 text-slate-950 hover:bg-amber-300";

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 text-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/80"
      aria-label={`Play ${title}. This loads YouTube's privacy-enhanced player.`}
      data-video-placeholder="youtube"
    >
      <span
        aria-hidden="true"
        className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl shadow-lg transition-transform hover:scale-105 ${buttonColor}`}
      >
        &#9654;
      </span>
      <span className="max-w-md text-sm font-semibold text-white">Play {title}</span>
      <span className="max-w-md text-xs leading-relaxed text-slate-300">
        YouTube's privacy-enhanced player loads only after you choose Play.
      </span>
    </button>
  );
}
