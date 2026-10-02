"use client";

import Image from "next/image";
import { useRef, useState, type ReactNode } from "react";
import { worlds, type WorldId } from "./worlds";

export function WorldGallery({ panels }: { panels: ReactNode[] }) {
  const [active, setActive] = useState<WorldId>("aurora");
  const [loading, setLoading] = useState<WorldId | null>(null);
  const [error, setError] = useState("");
  const request = useRef(0);
  const cache = useRef(new Map<WorldId, Promise<void>>());

  function prepare(id: WorldId) {
    const cached = cache.current.get(id);
    if (cached) return cached;
    const ready = new Promise<void>((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => { image.decode().then(resolve).catch(reject); };
      image.onerror = () => reject(new Error("Artwork unavailable"));
      image.src = `/worlds/${id}.png`;
    }).catch((reason) => { cache.current.delete(id); throw reason; });
    cache.current.set(id, ready);
    return ready;
  }

  async function select(id: WorldId) {
    const version = ++request.current;
    setError("");
    if (id === active) { setLoading(null); return; }
    setLoading(id);
    try {
      await prepare(id);
      if (request.current === version) setActive(id);
    } catch {
      if (request.current === version) setError("This world could not load. Please try again.");
    } finally {
      if (request.current === version) setLoading(null);
    }
  }

  return (
    <div className="world-gallery">
      <div className="world-selector shell" role="group" aria-label="Choose a Material World">
        {worlds.map((world) => <button key={world.id} type="button" className="world-choice" aria-pressed={active === world.id} aria-controls={`world-preview-${world.id}`} onPointerEnter={() => { void prepare(world.id).catch(() => {}); }} onFocus={() => { void prepare(world.id).catch(() => {}); }} onClick={() => { void select(world.id); }}>
          <Image src={`/worlds/${world.id}.png`} alt="" width={96} height={112} sizes="46px" />
          <span>{world.name}</span><small>{world.index}</small><span aria-hidden="true">↗</span>
        </button>)}
      </div>
      <p className="world-selection-status shell" role="status">{error || (loading ? `Preparing ${worlds.find((world) => world.id === loading)?.name}…` : "Choose a world. See the same NEVER in a different light.")}</p>
      <div className="world-stage" aria-busy={loading !== null}>
        {worlds.map((world, index) => <div id={`world-preview-${world.id}`} key={world.id} hidden={active !== world.id}>{panels[index]}</div>)}
      </div>
      <div className="basic-appearance shell"><div className="basic-swatches" aria-hidden="true"><i /><i /></div><div><strong>Prefer something simpler?</strong><p>System appearance follows your iPhone’s light or dark mode with a clean, artwork-free background.</p></div><a href="#pricing">Explore the plans <span aria-hidden="true">↗</span></a></div>
    </div>
  );
}
