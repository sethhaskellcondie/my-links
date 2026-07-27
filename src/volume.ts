// How loud the set is, in six steps. 0 reads as MUTE on screen and silences
// the speaker; 1–5 play at rising gain (see audio.ts for the curve).

import { createState } from "./state";

export type Volume = 0 | 1 | 2 | 3 | 4 | 5;

export const MIN_VOLUME = 0;
export const MAX_VOLUME = 5;

// Starts muted. Browsers refuse to play audio before the first click anyway,
// so the static begins the moment the viewer asks for it with VOL +.
const volume = createState<Volume>(MIN_VOLUME);

// Mirrored onto `<html data-volume>` alongside the channel.
volume.subscribe((next) => {
  document.documentElement.dataset.volume = String(next);
});

export const getVolume = volume.get;
export const onVolumeChange = volume.subscribe;

/** Move the volume by one step, clamped to 0–5. */
export function stepVolume(delta: number): void {
  const next = Math.min(MAX_VOLUME, Math.max(MIN_VOLUME, getVolume() + delta));
  volume.set(next as Volume);
}

/** On-screen readout, following the CH indicator's format. */
export function formatVolume(value: Volume): string {
  return value === MIN_VOLUME ? "MUTE" : `VOL ${value}`;
}
