// What the site is currently tuned to. The CRT boots on channel 3; the Game
// Doy is its own channel; `off` means the device on screen has been powered
// down. Only one device is ever visible at a time, so a single value is
// enough — each device publishes here when its power state changes.

import { createState } from "./state";

export type Channel = 3 | "off" | "game_boy";

const channel = createState<Channel>(3);

// Mirrored onto `<html data-channel>` so the state is visible to CSS and devtools.
channel.subscribe((next) => {
  document.documentElement.dataset.channel = String(next);
});

export const getChannel = channel.get;
export const setChannel = channel.set;
export const onChannelChange = channel.subscribe;
