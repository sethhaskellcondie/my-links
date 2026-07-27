// Sound for the CRT: channel 3 hisses, and the set thunks as it powers down.
// The hiss follows the volume knob; the thunk is fixed. Both elements are
// built lazily, so neither file is fetched until something actually plays.

import { getChannel, onChannelChange } from "./channel";
import { getVolume, onVolumeChange, type Volume } from "./volume";

const STATIC_SRC = "/sound-effects/tv-static.mp3";
const OFF_SRC = "/sound-effects/tv-off.mp3";

// The power-down thunk always plays at this step, whatever the set is tuned
// to — it's a one-shot, not part of the broadcast.
const OFF_VOLUME: Volume = 4;

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
let offSound: HTMLAudioElement | undefined;

function loop(): HTMLAudioElement {
  if (!staticLoop) {
    staticLoop = new Audio(STATIC_SRC);
    staticLoop.loop = true;
  }
  return staticLoop;
}

/**
 * The CRT's power-down thunk — for the TV only (both bezels); the Game Doy
 * powers down silently. Rewound on every call so rapid toggles retrigger it.
 * Deliberately ignores MUTE: the thunk is the set's mechanism, not its
 * broadcast, so it plays at OFF_VOLUME however the speaker is set.
 */
export function playTvOff(): void {
  if (!offSound) offSound = new Audio(OFF_SRC);
  offSound.volume = GAIN[OFF_VOLUME];
  offSound.currentTime = 0;
  void offSound.play().catch(() => {});
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
