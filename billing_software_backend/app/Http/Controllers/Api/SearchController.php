<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Professional keyword-based product search for the customer storefront.
 *
 * GET /api/search/suggestions?q=sil&company_id=1&limit=10
 * GET /api/search/products?q=silk+lehenga&company_id=3&per_page=24&page=1
 *
 * Both endpoints share the SAME matching + relevance logic (see
 * `searchTerms`, `applySearchFilter` and `scoreExpression`) so a query that
 * matches suggestions always matches the full results page identically.
 */
class SearchController extends Controller
{
    /**
     * Normalize a raw query string into a clean list of search terms.
     * Trims whitespace, collapses multiple spaces and lowercases each term.
     *
     * @return string[]
     */
    private function searchTerms($q): array
    {
        $q = mb_strtolower(trim((string) $q));
        $parts = preg_split('/\s+/', $q) ?: [];
        $terms = [];
        foreach ($parts as $part) {
            $part = trim($part);
            if ($part !== '') {
                $terms[] = $part;
            }
        }
        return $terms;
    }

    /**
     * Apply the shared match filter for a single term onto the product query.
     * A product matches if the term appears in its name, code, description,
     * color, category/subcategory/brand name, or any stored keyword.
     */
    private function applySearchFilter($query, array $terms): void
    {
        foreach ($terms as $term) {
            $termLike = '%' . $term . '%';
            $query->where(function ($w) use ($termLike) {
                $w->where('p.product_name', 'like', $termLike)
                    ->orWhere('p.product_code', 'like', $termLike)
                    ->orWhere('p.full_description', 'like', $termLike)
                    ->orWhere('p.short_description', 'like', $termLike)
                    ->orWhere('p.color', 'like', $termLike)
                    ->orWhere('c.name', 'like', $termLike)
                    ->orWhere('sc.name', 'like', $termLike)
                    ->orWhere('b.name', 'like', $termLike)
                    ->orWhereExists(function ($sub) use ($termLike) {
                        $sub->select(DB::raw(1))
                            ->from('product_keywords')
                            ->whereColumn('product_keywords.product_id', 'p.id')
                            ->where('product_keywords.keyword', 'like', $termLike);
                    });
            });
        }
    }

    /**
     * Build the raw SQL relevance-score expression from the given terms.
     * Higher priority comes first (exact name > exact keyword > partial
     * keyword > category/subcategory/brand > description/color > code).
     */
    private function scoreExpression(array $terms): string
    {
        $pdo = DB::connection()->getPdo();
        $scoreParts = [];

        foreach ($terms as $term) {
            $termEq = $pdo->quote($term);         // exact match literal
            $termLikeRaw = $pdo->quote('%' . $term . '%'); // partial literal

            $scoreParts[] = "(CASE WHEN p.product_name = {$termEq} THEN 100 ELSE 0 END"
                . " + CASE WHEN p.product_name LIKE {$termLikeRaw} THEN 50 ELSE 0 END"
                . " + CASE WHEN EXISTS(SELECT 1 FROM product_keywords pk1 WHERE pk1.product_id = p.id AND pk1.keyword = {$termEq}) THEN 80 ELSE 0 END"
                . " + CASE WHEN EXISTS(SELECT 1 FROM product_keywords pk2 WHERE pk2.product_id = p.id AND pk2.keyword LIKE {$termLikeRaw}) THEN 40 ELSE 0 END"
                . " + CASE WHEN c.name LIKE {$termLikeRaw} THEN 30 ELSE 0 END"
                . " + CASE WHEN sc.name LIKE {$termLikeRaw} THEN 30 ELSE 0 END"
                . " + CASE WHEN b.name LIKE {$termLikeRaw} THEN 30 ELSE 0 END"
                . " + CASE WHEN p.full_description LIKE {$termLikeRaw} OR p.short_description LIKE {$termLikeRaw} THEN 20 ELSE 0 END"
                . " + CASE WHEN p.color LIKE {$termLikeRaw} THEN 15 ELSE 0 END"
                . " + CASE WHEN p.product_code LIKE {$termLikeRaw} THEN 10 ELSE 0 END)";
        }

        return implode(' + ', $scoreParts);
    }

    /**
     * Fast, lightweight live suggestions used by the search box dropdown.
     * Shares the exact match + relevance logic of the full search.
     */
    public function suggestions(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        $companyId = intval($request->query('company_id', 0));
        $limit = (int) $request->query('limit', 10);
        $limit = min(max($limit, 1), 10);

        if ($q === '') {
            return response()->json(["status" => true, "data" => []]);
        }

        $terms = $this->searchTerms($q);

        $query = DB::table('products as p')
            ->leftJoin('categories as c', 'p.category_id', '=', 'c.id')
            ->leftJoin('subcategories as sc', 'p.subcategory_id', '=', 'sc.id')
            ->leftJoin('brands as b', 'p.brand_id', '=', 'b.id')
            ->where('p.is_deleted', 0)
            ->where(function ($q2) {
                $q2->where('p.active_status', '=', 'active')
                    ->orWhereNull('p.active_status');
            });

        // Only scope to a company when one is explicitly requested, so that
        // the storefront can search across all active products otherwise.
        if ($companyId > 0) {
            $query->where('p.company_id', $companyId);
        }

        $query->addSelect([
            'p.id',
            'p.product_name',
            'p.product_code',
            'p.image',
            'p.video_url',
            'p.price',
            'p.color',
            'c.name as category_name',
            'sc.name as subcategory_name',
            'b.name as brand_name',
        ]);

        if (count($terms) > 0) {
            $this->applySearchFilter($query, $terms);
            $query->selectRaw($this->scoreExpression($terms) . ' as relevance_score');
        }

        $query->orderByDesc('relevance_score')
            ->orderBy('p.created_at', 'desc')
            ->limit($limit);

        $rows = $query->get();

        $data = $rows->map(function ($r) {
            return [
                'id' => $r->id,
                'name' => $r->product_name,
                'product_name' => $r->product_name,
                'slug' => $this->slugify($r->product_name),
                'image' => $r->image,
                'image_src' => $this->imageSrc($r->image),
                'video_url' => $r->video_url,
                'price' => $r->price !== null ? floatval($r->price) : null,
                'category_name' => $r->category_name,
                'subcategory_name' => $r->subcategory_name,
                'brand_name' => $r->brand_name,
                'color' => $r->color,
            ];
        });

        return response()->json(["status" => true, "data" => $data]);
    }

    /**
     * Full keyword product search results (paginated).
     *
     * Priority ranking (highest first):
     *   1. Exact product name
     *   2. Exact keyword
     *   3. Partial keyword
     *   4. Category / Subcategory / Brand
     *   5. Description / Color / Product code
     * Search is case-insensitive, ignores extra spaces and supports
     * multiple terms (every term must match at least one field).
     */
    public function products(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        $companyId = intval($request->query('company_id', 0));
        $categoryId = intval($request->query('category_id', 0));
        $minPrice = $request->filled('min_price') ? floatval($request->query('min_price')) : null;
        $maxPrice = $request->filled('max_price') ? floatval($request->query('max_price')) : null;
        $availability = $request->query('availability', '');
        $sort = $request->query('sort', '');
        $perPage = (int) ($request->query('per_page', 12) ?: 12);
        $perPage = min(max($perPage, 1), 100);

        $query = DB::table('products as p')
            ->leftJoin('categories as c', 'p.category_id', '=', 'c.id')
            ->leftJoin('subcategories as sc', 'p.subcategory_id', '=', 'sc.id')
            ->leftJoin('brands as b', 'p.brand_id', '=', 'b.id')
            ->select(
                'p.*',
                'c.name as category_name',
                'sc.name as subcategory_name',
                'b.name as brand_name'
            )
            ->where('p.is_deleted', 0)
            ->where(function ($q2) {
                $q2->where('p.active_status', '=', 'active')
                    ->orWhereNull('p.active_status');
            });

        // Company + category scoping (matches ShopController behaviour).
        if ($categoryId > 0) {
            $category = Category::find($categoryId);
            if ($category) {
                $query->where('p.category_id', $categoryId);
                $query->where('p.company_id', $category->company_id);
            }
        } elseif ($companyId > 0) {
            $query->where('p.company_id', $companyId);
        }

        if ($minPrice !== null) {
            $query->where('p.price', '>=', $minPrice);
        }
        if ($maxPrice !== null) {
            $query->where('p.price', '<=', $maxPrice);
        }
        if ($availability === 'in_stock') {
            $query->where('p.stock', '>', 0);
        } elseif ($availability === 'out_of_stock') {
            $query->where(function ($q) {
                $q->where('p.stock', '<=', 0)->orWhereNull('p.stock');
            });
        }

        $sizes = $this->normalizeList($request->input('sizes'));
        if (count($sizes) > 0) {
            $query->where(function ($q) use ($sizes) {
                foreach ($sizes as $size) {
                    $q->orWhere('p.available_sizes', 'like', "%{$size}%");
                }
            });
        }

        $brandId = intval($request->query('brand_id', 0));
        if ($brandId > 0) {
            $query->where('p.brand_id', $brandId);
        }

        $color = trim((string) $request->query('color', ''));
        if ($color !== '') {
            $query->where('p.color', 'like', "%{$color}%");
        }

        // ── Multi-word search + shared relevance scoring ──
        $terms = $this->searchTerms($q);
        if (count($terms) > 0) {
            $this->applySearchFilter($query, $terms);
            $query->selectRaw($this->scoreExpression($terms) . ' as relevance_score');
        }

        // Ordering
        if (in_array($sort, ['price_asc', 'price_desc'], true)) {
            $query->orderBy('p.price', $sort === 'price_asc' ? 'asc' : 'desc');
        } elseif (count($terms) > 0) {
            $query->orderByDesc('relevance_score')->orderBy('p.created_at', 'desc');
        } else {
            $query->orderBy('p.created_at', 'desc');
        }

        $results = $query->paginate($perPage);

        return response()->json([
            "success" => true,
            "message" => "Products searched successfully",
            "data" => $results,
        ]);
    }
    /** Build a URL-safe slug from a product name. */
    private function slugify($text): string
    {
        $text = strtolower(trim((string) $text));
        $text = preg_replace('/[^a-z0-9]+/', '-', $text) ?? '';
        return trim($text, '-');
    }

    /**
     * Normalize a sizes / multi-value input (array or comma-separated string)
     * into a clean list of trimmed strings.
     */
    private function normalizeList($value): array
    {
        if (is_array($value)) {
            $items = $value;
        } else {
            $items = preg_split('/[,;|]+/', (string) $value) ?: [];
        }

        $result = [];
        foreach ($items as $item) {
            $item = trim((string) $item);
            if ($item !== '') {
                $result[] = $item;
            }
        }
        return $result;
    }

    /** Resolve a stored image to a usable source URL. */
    private function imageSrc($image)
    {
        if (!$image) {
            return null;
        }
        if (filter_var($image, FILTER_VALIDATE_URL) || strpos($image, 'data:') === 0) {
            return $image;
        }
        $path = preg_replace('#^storage/#', '', (string) $image);
        return asset('storage/' . $path);
    }
}