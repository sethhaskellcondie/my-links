// What the site is currently tuned to. The CRT carries channels 3–5; the Game
// Doy is its own channel; `off` means the device on screen has been powered
// down. Only one device is ever visible at a time, so a single value is
// enough — each device publishes here when its power state changes.

import { createState } from "./state";

/** The CRT's dial. CH − / + cycle these and nothing else. */
export type NumberedChannel = 3 | 4 | 5;

export type Channel = NumberedChannel | "off" | "game_boy";

const DIAL: NumberedChannel[] = [3, 4, 5];

const channel = createState<Channel>(3);

// Mirrored onto `<html data-channel>` so the state is visible to CSS and devtools.
channel.subscribe((next) => {
  document.documentElement.dataset.channel = String(next);
});

export const getChannel = channel.get;
export const setChannel = channel.set;
export const onChannelChange = channel.subscribe;

export function isNumberedChannel(value: Channel): value is NumberedChannel {
  return value !== "off" && value !== "game_boy";
}

/**
 * Move one step around the dial, wrapping 5 → 3 and 3 → 5. A no-op while the
 * set is off or the Game Doy is on screen — CH only ever retunes the CRT.
 */
export function stepChannel(delta: number): void {
  const current = getChannel();
  if (!isNumberedChannel(current)) return;

  const index = DIAL.indexOf(current);
  channel.set(DIAL[(index + delta + DIAL.length) % DIAL.length]);
}

/** On-screen readout, matching the VOL indicator's format. */
export function formatChannel(value: NumberedChannel): string {
  return `CH 0${value}`;
}
