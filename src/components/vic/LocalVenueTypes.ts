export type VenueSuggestion = {
  id: string;
  name: string;
  address?: string;
  city?: string;
  coverUrl?: string;
  about?: string;
  isNew?: boolean;
};

export type CreateLocationInput = {
  name: string;
  address: string;
  city: string;
  about?: string;
  eventDateTime?: string; // ISO datetime-local value
  coverUrl?: string;
  coverFile?: File;
};
