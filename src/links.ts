// All the link data for the site lives here.
//
// Each link has three parts:
//   - name: what the link is called (e.g. "My Blog")
//   - verb: the action shown on the button (e.g. "Read", "Visit", "Explore")
//   - url:  where the link points
//
// Add, remove, or edit entries below — the UI updates itself to match how
// many links are present.

export type Link = {
  name: string;
  verb: string;
  url: string;
};

const allLinks: Link[] = [
  {
    name: "Hidden",
    verb: "Hidden",
    url: "https://www.youtube.com/playlist?list=PLiQ74z4Kw1NBeHaPagL1XAFvieV12aLZY",
  },
  {
    name: "Discord",
    verb: "Join",
    url: "https://discord.gg/CUuAY7PYbt",
  },
  {
    name: "YouTube",
    verb: "Watch",
    url: "https://www.youtube.com/@SethHaskell",
  },
  {
    name: "YouTube Live",
    verb: "Watch",
    url: "https://www.youtube.com/@SethHaskellLive",
  },
  {
    name: "Twitch",
    verb: "Chat",
    url: "https://twitch.tv/sethhaskell",
  },
  {
    name: "Stream Achievements",
    verb: "Monitor",
    url: "https://docs.google.com/spreadsheets/d/1zIik-mvDE7gpzniNk3TZisPlVCBe2htASHVdHJqibvs",
  },
];

/**
 * The "Hidden" entry is an easter egg: it is never rendered in the menu.
 * Clicking the PRESS START text opens it instead.
 */
export const hiddenLink = allLinks.find(
  (link) => link.name === "Hidden" && link.verb === "Hidden",
);

/** The links shown in the on-screen menus. */
export const links = allLinks.filter((link) => link !== hiddenLink);
