import * as Crypto from 'expo-crypto';
import { getDatabase } from './schema';
import {
  Card,
  Category,
  CardWithCategories,
  CategoryWithCount,
  SortOptions,
  ExportData,
} from '@/types';
import { UNCATEGORIZED_ID, UNCATEGORIZED_NAME } from '@/constants';

function generateId(): string {
  return Crypto.randomUUID();
}

// ============ Categories ============

export async function getAllCategories(): Promise<CategoryWithCount[]> {
  const db = await getDatabase();

  const categories = await db.getAllAsync<CategoryWithCount>(`
    SELECT
      c.*,
      COUNT(cc.card_id) as card_count
    FROM categories c
    LEFT JOIN card_categories cc ON c.id = cc.category_id
    GROUP BY c.id
    ORDER BY c.name COLLATE NOCASE ASC
  `);

  // Add uncategorized count
  const uncategorizedCount = await db.getFirstAsync<{ count: number }>(`
    SELECT COUNT(*) as count FROM cards
    WHERE id NOT IN (SELECT DISTINCT card_id FROM card_categories)
  `);

  const uncategorized: CategoryWithCount = {
    id: UNCATEGORIZED_ID,
    name: UNCATEGORIZED_NAME,
    created_at: 0,
    updated_at: 0,
    card_count: uncategorizedCount?.count || 0,
  };

  return [uncategorized, ...categories];
}

export async function getCategoryById(id: string): Promise<Category | null> {
  if (id === UNCATEGORIZED_ID) {
    return {
      id: UNCATEGORIZED_ID,
      name: UNCATEGORIZED_NAME,
      created_at: 0,
      updated_at: 0,
    };
  }

  const db = await getDatabase();
  return db.getFirstAsync<Category>('SELECT * FROM categories WHERE id = ?', [id]);
}

export async function createCategory(name: string): Promise<Category> {
  const db = await getDatabase();
  const id = generateId();
  const now = Date.now();

  await db.runAsync(
    'INSERT INTO categories (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
    [id, name.trim(), now, now]
  );

  return { id, name: name.trim(), created_at: now, updated_at: now };
}

export async function updateCategory(id: string, name: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE categories SET name = ?, updated_at = ? WHERE id = ?',
    [name.trim(), Date.now(), id]
  );
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
}

export async function deleteCategoryAndCards(id: string): Promise<void> {
  const db = await getDatabase();

  // Get all cards that only belong to this category
  const cardsToDelete = await db.getAllAsync<{ id: string }>(`
    SELECT c.id FROM cards c
    INNER JOIN card_categories cc ON c.id = cc.card_id
    WHERE cc.category_id = ?
    AND c.id NOT IN (
      SELECT card_id FROM card_categories WHERE category_id != ?
    )
  `, [id, id]);

  // Delete cards that only belong to this category
  for (const card of cardsToDelete) {
    await db.runAsync('DELETE FROM cards WHERE id = ?', [card.id]);
  }

  // Delete the category (junction table entries will be deleted via CASCADE)
  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
}

export async function moveCategoryCardsTo(fromCategoryId: string, toCategoryId: string | null): Promise<void> {
  const db = await getDatabase();

  if (toCategoryId === null || toCategoryId === UNCATEGORIZED_ID) {
    // Move to uncategorized = just remove from this category
    await db.runAsync('DELETE FROM card_categories WHERE category_id = ?', [fromCategoryId]);
  } else {
    // Move cards to another category
    const cardIds = await db.getAllAsync<{ card_id: string }>(
      'SELECT card_id FROM card_categories WHERE category_id = ?',
      [fromCategoryId]
    );

    for (const { card_id } of cardIds) {
      // Check if already in target category
      const existing = await db.getFirstAsync(
        'SELECT 1 FROM card_categories WHERE card_id = ? AND category_id = ?',
        [card_id, toCategoryId]
      );

      if (!existing) {
        await db.runAsync(
          'INSERT INTO card_categories (card_id, category_id) VALUES (?, ?)',
          [card_id, toCategoryId]
        );
      }
    }

    // Remove from old category
    await db.runAsync('DELETE FROM card_categories WHERE category_id = ?', [fromCategoryId]);
  }

  // Delete the category
  await db.runAsync('DELETE FROM categories WHERE id = ?', [fromCategoryId]);
}

export async function categoryNameExists(name: string, excludeId?: string): Promise<boolean> {
  const db = await getDatabase();
  const trimmedName = name.trim().toLowerCase();

  if (trimmedName === UNCATEGORIZED_NAME.toLowerCase()) {
    return true;
  }

  let query = 'SELECT 1 FROM categories WHERE LOWER(name) = ?';
  const params: string[] = [trimmedName];

  if (excludeId) {
    query += ' AND id != ?';
    params.push(excludeId);
  }

  const result = await db.getFirstAsync(query, params);
  return result !== null;
}

// ============ Cards ============

export async function getAllCards(
  sortOptions: SortOptions = { field: 'alphabetical', direction: 'asc' },
  searchQuery?: string
): Promise<CardWithCategories[]> {
  const db = await getDatabase();

  let orderBy: string;
  switch (sortOptions.field) {
    case 'alphabetical':
      orderBy = `front_content COLLATE NOCASE ${sortOptions.direction.toUpperCase()}`;
      break;
    case 'created_at':
      orderBy = `created_at ${sortOptions.direction.toUpperCase()}`;
      break;
    case 'updated_at':
      orderBy = `updated_at ${sortOptions.direction.toUpperCase()}`;
      break;
    default:
      orderBy = 'front_content COLLATE NOCASE ASC';
  }

  let whereClause = '';
  const params: string[] = [];

  if (searchQuery && searchQuery.trim()) {
    const search = `%${searchQuery.trim()}%`;
    whereClause = 'WHERE front_content LIKE ? OR back_content LIKE ?';
    params.push(search, search);
  }

  const cards = await db.getAllAsync<Card>(
    `SELECT * FROM cards ${whereClause} ORDER BY ${orderBy}`,
    params
  );

  // Get categories for each card
  const cardsWithCategories: CardWithCategories[] = [];

  for (const card of cards) {
    const categories = await db.getAllAsync<Category>(`
      SELECT c.* FROM categories c
      INNER JOIN card_categories cc ON c.id = cc.category_id
      WHERE cc.card_id = ?
      ORDER BY c.name COLLATE NOCASE ASC
    `, [card.id]);

    cardsWithCategories.push({ ...card, categories });
  }

  return cardsWithCategories;
}

export async function getCardById(id: string): Promise<CardWithCategories | null> {
  const db = await getDatabase();

  const card = await db.getFirstAsync<Card>('SELECT * FROM cards WHERE id = ?', [id]);

  if (!card) return null;

  const categories = await db.getAllAsync<Category>(`
    SELECT c.* FROM categories c
    INNER JOIN card_categories cc ON c.id = cc.category_id
    WHERE cc.card_id = ?
    ORDER BY c.name COLLATE NOCASE ASC
  `, [id]);

  return { ...card, categories };
}

export async function getCardsByCategories(categoryIds: string[]): Promise<Card[]> {
  const db = await getDatabase();

  const hasUncategorized = categoryIds.includes(UNCATEGORIZED_ID);
  const realCategoryIds = categoryIds.filter(id => id !== UNCATEGORIZED_ID);

  let cards: Card[] = [];

  if (realCategoryIds.length > 0) {
    const placeholders = realCategoryIds.map(() => '?').join(',');
    const categoryCards = await db.getAllAsync<Card>(`
      SELECT DISTINCT c.* FROM cards c
      INNER JOIN card_categories cc ON c.id = cc.card_id
      WHERE cc.category_id IN (${placeholders})
    `, realCategoryIds);
    cards = [...categoryCards];
  }

  if (hasUncategorized) {
    const uncategorizedCards = await db.getAllAsync<Card>(`
      SELECT * FROM cards
      WHERE id NOT IN (SELECT DISTINCT card_id FROM card_categories)
    `);

    // Avoid duplicates
    const existingIds = new Set(cards.map(c => c.id));
    for (const card of uncategorizedCards) {
      if (!existingIds.has(card.id)) {
        cards.push(card);
      }
    }
  }

  return cards;
}

export async function createCard(
  frontContent: string,
  backContent: string,
  categoryIds: string[]
): Promise<CardWithCategories> {
  const db = await getDatabase();
  const id = generateId();
  const now = Date.now();

  await db.runAsync(
    'INSERT INTO cards (id, front_content, back_content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [id, frontContent, backContent, now, now]
  );

  // Add to categories (excluding uncategorized)
  const realCategoryIds = categoryIds.filter(cid => cid !== UNCATEGORIZED_ID);
  for (const categoryId of realCategoryIds) {
    await db.runAsync(
      'INSERT INTO card_categories (card_id, category_id) VALUES (?, ?)',
      [id, categoryId]
    );
  }

  const categories = realCategoryIds.length > 0
    ? await db.getAllAsync<Category>(
        `SELECT * FROM categories WHERE id IN (${realCategoryIds.map(() => '?').join(',')})`,
        realCategoryIds
      )
    : [];

  return {
    id,
    front_content: frontContent,
    back_content: backContent,
    created_at: now,
    updated_at: now,
    categories,
  };
}

export async function updateCard(
  id: string,
  frontContent: string,
  backContent: string,
  categoryIds: string[]
): Promise<void> {
  const db = await getDatabase();
  const now = Date.now();

  await db.runAsync(
    'UPDATE cards SET front_content = ?, back_content = ?, updated_at = ? WHERE id = ?',
    [frontContent, backContent, now, id]
  );

  // Update categories
  await db.runAsync('DELETE FROM card_categories WHERE card_id = ?', [id]);

  const realCategoryIds = categoryIds.filter(cid => cid !== UNCATEGORIZED_ID);
  for (const categoryId of realCategoryIds) {
    await db.runAsync(
      'INSERT INTO card_categories (card_id, category_id) VALUES (?, ?)',
      [id, categoryId]
    );
  }
}

export async function deleteCard(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM cards WHERE id = ?', [id]);
}

// ============ Import/Export ============

export async function exportData(): Promise<ExportData> {
  const db = await getDatabase();

  const categories = await db.getAllAsync<Category>('SELECT * FROM categories');
  const cards = await db.getAllAsync<Card>('SELECT * FROM cards');
  const cardCategories = await db.getAllAsync<{ card_id: string; category_id: string }>(
    'SELECT * FROM card_categories'
  );

  // Build card category map
  const cardCategoryMap = new Map<string, string[]>();
  for (const cc of cardCategories) {
    const existing = cardCategoryMap.get(cc.card_id) || [];
    existing.push(cc.category_id);
    cardCategoryMap.set(cc.card_id, existing);
  }

  return {
    version: 1,
    exported_at: new Date().toISOString(),
    categories: categories.map(c => ({ id: c.id, name: c.name })),
    cards: cards.map(c => ({
      id: c.id,
      front_content: c.front_content,
      back_content: c.back_content,
      category_ids: cardCategoryMap.get(c.id) || [],
    })),
  };
}

export async function findImportConflicts(data: ExportData): Promise<string[]> {
  const db = await getDatabase();
  const conflicts: string[] = [];

  for (const category of data.categories) {
    const existing = await db.getFirstAsync<Category>(
      'SELECT * FROM categories WHERE LOWER(name) = ?',
      [category.name.toLowerCase()]
    );
    if (existing) {
      conflicts.push(category.name);
    }
  }

  return conflicts;
}

export async function importData(
  data: ExportData,
  conflictResolutions: Map<string, 'merge' | 'overwrite'>
): Promise<{ cardsImported: number; categoriesImported: number }> {
  const db = await getDatabase();
  const now = Date.now();

  // Map old category IDs to new/existing IDs
  const categoryIdMap = new Map<string, string>();
  let categoriesImported = 0;

  for (const category of data.categories) {
    const existing = await db.getFirstAsync<Category>(
      'SELECT * FROM categories WHERE LOWER(name) = ?',
      [category.name.toLowerCase()]
    );

    if (existing) {
      const resolution = conflictResolutions.get(category.name);

      if (resolution === 'overwrite') {
        // Delete existing cards in this category (that don't belong to other categories)
        const cardsToDelete = await db.getAllAsync<{ id: string }>(`
          SELECT c.id FROM cards c
          INNER JOIN card_categories cc ON c.id = cc.card_id
          WHERE cc.category_id = ?
          AND c.id NOT IN (
            SELECT card_id FROM card_categories WHERE category_id != ?
          )
        `, [existing.id, existing.id]);

        for (const card of cardsToDelete) {
          await db.runAsync('DELETE FROM cards WHERE id = ?', [card.id]);
        }

        // Remove all card associations with this category
        await db.runAsync('DELETE FROM card_categories WHERE category_id = ?', [existing.id]);
      }

      categoryIdMap.set(category.id, existing.id);
    } else {
      // Create new category
      const newId = generateId();
      await db.runAsync(
        'INSERT INTO categories (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
        [newId, category.name, now, now]
      );
      categoryIdMap.set(category.id, newId);
      categoriesImported++;
    }
  }

  // Import cards
  let cardsImported = 0;

  for (const card of data.cards) {
    const newCardId = generateId();
    await db.runAsync(
      'INSERT INTO cards (id, front_content, back_content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [newCardId, card.front_content, card.back_content, now, now]
    );

    // Add category associations
    for (const oldCategoryId of card.category_ids) {
      const newCategoryId = categoryIdMap.get(oldCategoryId);
      if (newCategoryId) {
        await db.runAsync(
          'INSERT OR IGNORE INTO card_categories (card_id, category_id) VALUES (?, ?)',
          [newCardId, newCategoryId]
        );
      }
    }

    cardsImported++;
  }

  return { cardsImported, categoriesImported };
}
