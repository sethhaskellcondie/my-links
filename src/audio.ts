// Sound for the CRT: channel 3 hisses. The loop is gated on both the channel
// and the volume, and the element is built lazily so nothing is fetched while
// the set is muted.

import { getChannel, onChannelChange } from "./channel";
import { getVolume, onVolumeChange, type Volume } from "./volume";

const STATIC_SRC = "/sound-effects/tv-static.mp3";

// Gain per volume step (index = step). Curved rather than linear, because
// equal jumps in HTMLAudioElement.volume don't sound equally sized.
const GAIN: Record<Volume, number> = {
  0: 0,
  1: 0.1,
  2: 0.22,
  3: 0.4,
  4: 0.66,
  5: 1,
};

let staticLoop: HTMLAudioElement | undefined;

function loop(): HTMLAudioElement {
  if (!staticLoop) {
    staticLoop = new Audio(STATIC_SRC);
    staticLoop.loop = true;
  }
  return staticLoop;
}

function sync(): void {
  const volume = getVolume();

  if (getChannel() !== 3 || volume === 0) {
    staticLoop?.pause();
    return;
  }

  const audio = loop();
  audio.volume = GAIN[volume];
  // play() rejects until the page has been interacted with. The VOL + click
  // that unmutes the set is itself that interaction, so in practice this only
  // no-ops on a load that starts silent.
  if (audio.paused) void audio.play().catch(() => {});
}

/** Start following the channel and volume. Safe to call once, at startup. */
export function initAudio(): void {
  onChannelChange(sync);
  onVolumeChange(sync);
}
