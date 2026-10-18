'use client';
import { useState } from 'react';
import { channelPlaylist } from '../../lib/editorial';
export default function ChannelVideos({ videos = [], liveVideo }) {
  const items = channelPlaylist(videos, liveVideo);
  const [selected, setSelected] = useState('');
  const active = items.find(v => v.id === selected) || items[0];
  return <section className="channel-videos" aria-labelledby="videos-title">
    <div className="redesign-section-heading"><h2 id="videos-title">Jujuy247 en video</h2><a href="https://www.youtube.com/@jujuy247" target="_blank" rel="noreferrer">Ver el canal</a></div>
    {active ? <div className="channel-grid"><div><iframe key={active.id} src={`https://www.youtube-nocookie.com/embed/${active.id}`} title={active.title} loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /><h3>{active.title}</h3><a href={`https://www.youtube.com/watch?v=${active.id}`} target="_blank" rel="noreferrer">Abrir en YouTube</a></div><div className="channel-playlist">{items.map(v => <button key={v.id} type="button" onClick={() => setSelected(v.id)} aria-pressed={v.id === active.id}><img src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`} alt="" loading="lazy" width="160" height="90" /><span>{v.title}</span></button>)}</div></div> : <p>No pudimos cargar los videos. <a href="https://www.youtube.com/@jujuy247">Podés verlos en nuestro canal.</a></p>}
  </section>;
}
