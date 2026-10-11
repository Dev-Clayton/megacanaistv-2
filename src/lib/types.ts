export type Category = { id: number; name: string };

export type Channel = {
  id: string;
  name: string;
  image?: string;
  preview?: string;
  url?: string;
  categories: number[];
};

export type ChannelsData = { categories: Category[]; channels: Channel[] };

export type Team = { name: string; image?: string };

export type SportEvent = {
  id: string;
  slug: string;
  title: string;
  league: { name: string; image?: string };
  home: Team;
  away: Team;
  start?: string;
  end?: string;
  players: string[];
};

export type Program = { title: string; desc?: string; start: string };
export type EpgMap = Record<string, Program[]>;
