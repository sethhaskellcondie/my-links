// What each numbered channel is broadcasting.
//
// channel.ts owns which channel the set is tuned to; this file owns what that
// channel puts on the picture tube:
//   - "links": the title screen and start menu built from links.ts
//   - "text":  the static background with a single message on it
//
// Add a `text` entry here and the tube renders it — no other file needs to
// change.

import type { NumberedChannel } from "./channel";

export type ChannelContent =
  | { channel: NumberedChannel; type: "links" }
  | { channel: NumberedChannel; type: "text"; text: string };

export const channels: ChannelContent[] = [

    {
        channel: 3,
        type: "links"
    },
    {
        channel: 4,
        type: "text",
        text: `Boo the industry for removing physical media options! 
        
        Sony may have gone first but I suspect Xbox is heading in this direction and Nintendo keycards suck!`
    },
    {
        channel: 5,
        type: "text",
        text: `I'm working on launching a new way to display my collection, I'm excited to share it with you!
        
        Check Discord for details!`
    },
];

/** What channel `value` is showing. Unlisted channels fall back to the links. */
export function getChannelContent(value: NumberedChannel): ChannelContent {
  return (
    channels.find((entry) => entry.channel === value) ?? {
      channel: value,
      type: "links",
    }
  );
}
