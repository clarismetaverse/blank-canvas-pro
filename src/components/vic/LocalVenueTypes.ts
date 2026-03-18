export type VenueSuggestion = {
  id: string;
  name: string;
  address?: string;
  city?: string;
  cityId?: number;
  coverUrl?: string;
  isNew?: boolean;
};

export type CreateLocationInput = {
  id?: string;
  backendId?: number;
  name: string;
  address: string;
  city: string;
  cityId: number;
  coverUrl?: string;
};
