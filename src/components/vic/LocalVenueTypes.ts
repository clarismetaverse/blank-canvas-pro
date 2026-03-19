export type VenueSuggestion = {
  id: string;
  name: string;
  address?: string;
  city?: string;
  coverUrl?: string;
  isNew?: boolean;
};

export type CreateLocationInput = {
  Name: string;
  Adress: string;
  City: number;
  cityName: string;
  coverUrl?: string;
  coverFile?: File;
};
