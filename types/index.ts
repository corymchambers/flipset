export interface Card {
  id: string;
  front_content: string;
  back_content: string;
  created_at: number;
  updated_at: number;
}

export interface Category {
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
}

export interface CardCategory {
  card_id: string;
  category_id: string;
}

export interface CardWithCategories extends Card {
  categories: Category[];
}

export interface CategoryWithCount extends Category {
  card_count: number;
}

export type SortField = 'alphabetical' | 'created_at' | 'updated_at';
export type SortDirection = 'asc' | 'desc';

export interface SortOptions {
  field: SortField;
  direction: SortDirection;
}

export type SessionOrderMode = 'ordered' | 'random';

export interface SessionState {
  id: string;
  originalCardIds: string[];
  currentRound: number;
  currentIndex: number;
  orderMode: SessionOrderMode;
  correctBucket: string[];
  wrongBucket: string[];
  currentRoundCards: string[];
  isComplete: boolean;
  selectedCategoryIds: string[];
}

export interface ExportData {
  version: number;
  exported_at: string;
  categories: Array<{
    id: string;
    name: string;
  }>;
  cards: Array<{
    id: string;
    front_content: string;
    back_content: string;
    category_ids: string[];
  }>;
}

export interface ImportConflict {
  categoryName: string;
  existingCategoryId: string;
  importedCategoryId: string;
}

export type ImportConflictResolution = 'merge' | 'overwrite';
