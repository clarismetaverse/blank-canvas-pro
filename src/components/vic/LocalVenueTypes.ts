export type VenueSuggestion = {
  id: string;
  name: string;
  address?: string;
  city?: string;
  coverUrl?: string;
  isNew?: boolean;
};

export type CreateLocationInput = {
  name: string;
  address: string;
  city: string;
  coverUrl?: string;
  coverFile?: File;
};
