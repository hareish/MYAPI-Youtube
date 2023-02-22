export interface User {
  id: number;
  username: string;
  pseudo: string | null;
  createdAt: Date;
  email?: string;
}

export interface Video {
  id: number;
  name: string;
  source: string;
  created_at: Date;
  views: number;
  enabled: boolean;
  user: User;
  formats: VideoFormats;
}
interface VideoFormats {
  "1080": string | null;
  "720": string | null;
  "480": string | null;
  "360": string | null;
  "240": string | null;
  "144": string | null;
}

export interface Token {
  token: string;
  user: User;
}

export interface Comment {
  id: number;
  body: string;
  user: User;
}

export interface VideoDbResponse {
  id: number;
  name: string;
  source: string;
  created_at: Date;
  view: number;
  duration: number;
  enabled: number;
  user_id: number;
  username: string;
  pseudo: string;
  user_created_at: Date;
  format_1080: string | null;
  format_720: string | null;
  format_480: string | null;
  format_360: string | null;
  format_240: string | null;
  format_144: string | null;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
}