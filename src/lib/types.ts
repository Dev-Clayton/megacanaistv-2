export type Category = { id: number; name: string };

export type Channel = {
  id: string;
  name: string;
  image?: string | undefined;
  preview?: string | undefined;
  url?: string | undefined;
  categories: number[];
};

export type ChannelsData = { categories: Category[]; channels: Channel[] };

export type Team = { name: string; image?: string | undefined };

export type SportEvent = {
  id: string;
  slug: string;
  title: string;
  league: { name: string; image?: string | undefined };
  home: Team;
  away: Team;
  start?: string | undefined;
  end?: string | undefined;
  players: string[];
};

export type Program = { title: string; desc?: string | undefined; start: string };
export type EpgMap = Record<string, Program[]>;
