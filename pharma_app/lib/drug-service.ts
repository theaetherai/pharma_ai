import { db } from '@/lib/db';
import { Drug } from '@prisma/client';
import { getOrFetchCached, invalidateCache, invalidateCachePattern } from '@/lib/cache';

// Cache keys
const CACHE_KEYS = {
  ALL_DRUGS: 'all_drugs',
  DRUG_DETAIL: (id: string) => `drug:${id}`,
  DRUGS_PAGINATED: (page: number, perPage: number) => `drugs:page:${page}:per_page:${perPage}`,
  DRUG_STATS: 'drug_stats',
  DRUG_COUNT: 'drug_count',
  LOW_STOCK_DRUGS: 'drugs:low_stock',
  OUT_OF_STOCK_DRUGS: 'drugs:out_of_stock',
};

/**
 * Get a drug by ID with caching
 */
export async function getDrug(id: string): Promise<Drug | null> {
  return getOrFetchCached(
    CACHE_KEYS.DRUG_DETAIL(id),
    async () => {
      return db.drug.findUnique({
        where: { id },
      });
    },
    300 // 5 minutes cache
  );
}

/**
 * Get all drugs with caching
 */
export async function getAllDrugs(): Promise<Drug[]> {
  return getOrFetchCached(
    CACHE_KEYS.ALL_DRUGS,
    async () => {
      return db.drug.findMany({
        orderBy: { name: 'asc' },
      });
    },
    300 // 5 minutes cache
  );
}

/**
 * Get paginated drugs with caching
 */
export async function getDrugsWithPagination(
  page: number = 1,
  perPage: number = 10,
  searchQuery?: string
): Promise<{ drugs: Drug[]; totalCount: number }> {
  // If there's a search query, skip cache to ensure fresh results
  if (searchQuery) {
    const drugs = await db.drug.findMany({
      where: {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } },
        ],
      },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { name: 'asc' },
    });

    const totalCount = await db.drug.count({
      where: {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } },
        ],
      },
    });

    return { drugs, totalCount };
  }

  // Use cache for non-search queries
  return getOrFetchCached(
    CACHE_KEYS.DRUGS_PAGINATED(page, perPage),
    async () => {
      const drugs = await db.drug.findMany({
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { name: 'asc' },
      });

      const totalCount = await getOrFetchCached(
        CACHE_KEYS.DRUG_COUNT,
        async () => await db.drug.count(),
        600 // 10 minutes cache for count
      );

      return { drugs, totalCount };
    },
    300 // 5 minutes cache
  );
}

/**
 * Get drug statistics with caching
 */
export async function getDrugStatistics(): Promise<{
  totalCount: number;
  lowStockCount: number;
  outOfStockCount: number;
}> {
  return getOrFetchCached(
    CACHE_KEYS.DRUG_STATS,
    async () => {
      const totalCount = await db.drug.count();
      
      const lowStockCount = await db.drug.count({
        where: {
          stock_quantity: { lte: 10, gt: 0 },
        },
      });
      
      const outOfStockCount = await db.drug.count({
        where: {
          stock_quantity: { equals: 0 },
        },
      });
      
      return { totalCount, lowStockCount, outOfStockCount };
    },
    600 // 10 minutes cache
  );
}

/**
 * Get low stock drugs
 */
export async function getLowStockDrugs(): Promise<Drug[]> {
  return getOrFetchCached(
    CACHE_KEYS.LOW_STOCK_DRUGS,
    async () => {
      return db.drug.findMany({
        where: {
          stock_quantity: { lte: 10, gt: 0 },
        },
        orderBy: { stock_quantity: 'asc' },
      });
    },
    300 // 5 minutes cache
  );
}

/**
 * Get out of stock drugs
 */
export async function getOutOfStockDrugs(): Promise<Drug[]> {
  return getOrFetchCached(
    CACHE_KEYS.OUT_OF_STOCK_DRUGS,
    async () => {
      return db.drug.findMany({
        where: {
          stock_quantity: { equals: 0 },
        },
        orderBy: { name: 'asc' },
      });
    },
    300 // 5 minutes cache
  );
}

/**
 * Create a new drug
 */
export async function createDrug(data: Omit<Drug, 'id' | 'createdAt' | 'updatedAt'>): Promise<Drug> {
  const drug = await db.drug.create({
    data,
  });
  
  // Invalidate relevant caches
  invalidateCache(CACHE_KEYS.ALL_DRUGS);
  invalidateCache(CACHE_KEYS.DRUG_STATS);
  invalidateCache(CACHE_KEYS.DRUG_COUNT);
  invalidateCachePattern(/^drugs:page:/);
  
  return drug;
}

/**
 * Update a drug
 */
export async function updateDrug(id: string, data: Partial<Omit<Drug, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Drug> {
  const drug = await db.drug.update({
    where: { id },
    data,
  });
  
  // Invalidate relevant caches
  invalidateCache(CACHE_KEYS.DRUG_DETAIL(id));
  invalidateCache(CACHE_KEYS.ALL_DRUGS);
  invalidateCache(CACHE_KEYS.DRUG_STATS);
  invalidateCachePattern(/^drugs:page:/);
  
  // Handle stock-related cache invalidation
  if (data.stock_quantity !== undefined) {
    invalidateCache(CACHE_KEYS.LOW_STOCK_DRUGS);
    invalidateCache(CACHE_KEYS.OUT_OF_STOCK_DRUGS);
  }
  
  return drug;
}

/**
 * Delete a drug
 */
export async function deleteDrug(id: string): Promise<Drug> {
  const drug = await db.drug.delete({
    where: { id },
  });
  
  // Invalidate relevant caches
  invalidateCache(CACHE_KEYS.DRUG_DETAIL(id));
  invalidateCache(CACHE_KEYS.ALL_DRUGS);
  invalidateCache(CACHE_KEYS.DRUG_STATS);
  invalidateCache(CACHE_KEYS.DRUG_COUNT);
  invalidateCache(CACHE_KEYS.LOW_STOCK_DRUGS);
  invalidateCache(CACHE_KEYS.OUT_OF_STOCK_DRUGS);
  invalidateCachePattern(/^drugs:page:/);
  
  return drug;
} 