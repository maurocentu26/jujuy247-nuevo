export function headerScrollState(y, previousY, hidden) {
  y = Math.max(0, y);
  const moved = Math.abs(y - previousY) > 4;
  return {
    compact: y > 100,
    hidden: y < 100 ? false : moved ? y > previousY : hidden,
    previousY: moved ? y : previousY,
  };
}

export function channelPlaylist(videos = [], liveVideo) {
  return [liveVideo, ...videos].filter((video, index, all) =>
    video && /^[\w-]{11}$/.test(video.id) && all.findIndex(v => v?.id === video.id) === index
  ).slice(0, 4);
}
