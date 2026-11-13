/**
 * Opt-in rAF cadence sampling for local and Pages preview QA only.
 * This is NOT a measurement of GPU utilization or CSS-only animation FPS.
 * For CPU/GPU analysis use DevTools Performance traces.
 */
export function startBodygraphMotionSampler(root: HTMLElement): () => void {
  let frame = 0;
  let last = 0;
  let started = 0;
  let count = 0;
  let worstFrameMs = 0;
  const tick = (now: number) => {
    if (!root.isConnected) return;
    if (document.hidden) {
      last = now;
      started = now;
      count = 0;
      worstFrameMs = 0;
      frame = requestAnimationFrame(tick);
      return;
    }
    if (!started) started = now;
    if (last) {
      const delta = now - last;
      if (delta < 1000) worstFrameMs = Math.max(worstFrameMs, delta);
    }
    last = now;
    count++;
    const elapsed = now - started;
    if (elapsed >= 2000) {
      const fps = Math.round(count * 1000 / elapsed);
      console.info(
        `[bodygraph-motion-qa] fps=${fps} worstFrameMs=${worstFrameMs.toFixed(1)} ` +
        `state=${root.dataset.motionState} preset=${root.dataset.motionPreset}`,
      );
      started = now;
      count = 0;
      worstFrameMs = 0;
    }
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}
