<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;

class CategoryController extends Controller
{
    public function create(Request $request)
    {
        $name = trim($request->input('name', ''));
        $company_id = intval($request->input('company_id', 0));
        $image_url = trim($request->input('image_url', ''));
        $video_url = trim($request->input('video_url', ''));

        if (!$name || !$company_id) {
            return response()->json([
                "status" => false,
                "message" => "Required fields missing"
            ]);
        }

        // Validate IMAGE URL
        $validatedImageUrl = null;
        if (!empty($image_url)) {
            if (filter_var($image_url, FILTER_VALIDATE_URL)) {
                $validatedImageUrl = $image_url;
            } else {
                return response()->json([
                    "status" => false,
                    "message" => "Invalid image URL format"
                ]);
            }
        }

        // Validate VIDEO URL
        $validatedVideoUrl = null;
        if (!empty($video_url)) {
            if (filter_var($video_url, FILTER_VALIDATE_URL)) {
                $validatedVideoUrl = $video_url;
            } else {
                return response()->json([
                    "status" => false,
                    "message" => "Invalid video URL format"
                ]);
            }
        }

        Category::create([
            'name' => $name,
            'company_id' => $company_id,
            'image' => $validatedImageUrl,  // IMAGES go here
            'video' => $validatedVideoUrl,  // VIDEOS go here
            'status' => 'active',
            'is_deleted' => 0,
            'spotlight_active' => intval($request->input('spotlight_active', 0)) ? 1 : 0
        ]);

        $this->forgetStorefrontCache($company_id);

        return response()->json([
            "status" => true,
            "message" => "Category created successfully"
        ]);
    }

    public function update(Request $request)
    {
        $id = intval($request->input('id', 0));
        $name = trim($request->input('name', ''));
        $image_url = trim($request->input('image_url', ''));
        $video_url = trim($request->input('video_url', ''));

        if (!$id || !$name) {
            return response()->json([
                "status" => false,
                "message" => "Required fields missing"
            ]);
        }

        $category = Category::find($id);
        if (!$category) {
            return response()->json([
                "status" => false,
                "message" => "Category not found"
            ]);
        }

        $updateData = ['name' => $name];

        // Handle IMAGE URL update
        if ($request->has('image_url')) {
            if (!empty($image_url)) {
                if (filter_var($image_url, FILTER_VALIDATE_URL)) {
                    $updateData['image'] = $image_url;
                } else {
                    return response()->json([
                        "status" => false,
                        "message" => "Invalid image URL format"
                    ]);
                }
            } else if ($request->input('remove_image') == true) {
                $updateData['image'] = null;
            }
        }

        // Handle VIDEO URL update
        if ($request->has('video_url')) {
            if (!empty($video_url)) {
                if (filter_var($video_url, FILTER_VALIDATE_URL)) {
                    $updateData['video'] = $video_url;
                } else {
                    return response()->json([
                        "status" => false,
                        "message" => "Invalid video URL format"
                    ]);
                }
            } else if ($request->input('remove_video') == true) {
                $updateData['video'] = null;
            }
        }

        // Handle spotlight flag (0 = off, 1 = on) — enforce only ONE active category
        if ($request->has('spotlight_active')) {
            $spotlightValue = intval($request->input('spotlight_active')) ? 1 : 0;
            if ($spotlightValue === 1) {
                Category::where('id', '!=', $id)->update(['spotlight_active' => 0]);
            }
            $updateData['spotlight_active'] = $spotlightValue;
        }

        Category::where('id', $id)->update($updateData);

        $this->forgetStorefrontCache($category->company_id);

        return response()->json([
            "status" => true,
            "message" => "Category updated successfully"
        ]);
    }

    public function delete(Request $request)
    {
        $id = intval($request->input('id', 0));
        if (!$id) {
            return response()->json([
                "status" => false,
                "message" => "ID required"
            ]);
        }

        DB::beginTransaction();
        try {
            Product::where('category_id', $id)->delete();

            $category = Category::where('id', $id)->first();
            Category::where('id', $id)->delete();
            $this->forgetStorefrontCache($category ? $category->company_id : 0);

            DB::commit();
            return response()->json([
                "status" => true,
                "message" => "Category + related products deleted"
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                "status" => false,
                "message" => $e->getMessage()
            ]);
        }
    }

    public function getActiveCategory(Request $request)
    {
        $company_id = intval($request->input('company_id') ?: $request->query('company_id', 0));

        $key = $this->cacheKey('active', $company_id);
        $categories = Cache::remember($key, 300, function () use ($company_id) {
            $query = Category::where('status', 'active')
                ->where('is_deleted', 0);

            if ($company_id) {
                $query->where('company_id', $company_id);
            }

            $categories = $query->orderBy('id', 'desc')->get();

            $categories->each(function ($category) {
                $category->image_src = $category->image_src;
                $category->video_src = $category->video_src;
            });

            return $categories;
        });

        return response()->json([
            "status" => true,
            "data" => $categories
        ]);
    }

    public function getAll(Request $request)
    {
        $company_id = intval($request->input('company_id') ?: $request->query('company_id', 0));

        $key = $this->cacheKey('all', $company_id);
        $categories = Cache::remember($key, 300, function () use ($company_id) {
            $query = Category::where('is_deleted', 0);

            if ($company_id) {
                $query->where('company_id', $company_id);
            }

            $categories = $query->orderBy('id', 'desc')->get();

            $categories->each(function ($category) {
                $category->image_src = $category->image_src;
                $category->video_src = $category->video_src;
            });

            return $categories;
        });

        return response()->json([
            "status" => true,
            "data" => $categories
        ]);
    }

    public function getById(Request $request)
    {
        $id = intval($request->input('id') ?: $request->query('id', 0));
        $category = Category::where('id', $id)->first();

        if (!$category) {
            return response()->json([
                "status" => false,
                "message" => "Category not found"
            ]);
        }

        $categoryData = $category->toArray();
        $categoryData['image_src'] = $category->image_src;
        $categoryData['video_src'] = $category->video_src;

        return response()->json([
            "status" => true,
            "data" => $categoryData
        ]);
    }

    public function toggleCategoryStatus(Request $request)
    {
        $id = intval($request->input('id', 0));
        $status = $request->input('status', '');

        if (!$id || !$status) {
            return response()->json([
                "status" => false,
                "message" => "Invalid data"
            ]);
        }

        Category::where('id', $id)->update(['status' => $status]);

        $this->forgetStorefrontCache(Category::find($id)->company_id ?? 0);

        return response()->json([
            "status" => true,
            "message" => "Status updated successfully"
        ]);
    }

    /**
     * Toggle the "Spotlight" flag for a single category.
     * Only ONE category can be active at a time (exclusive).
     *
     * POST /api/category/toggle_spotlight
     * Body: { id: 5, spotlight_active: 1 | 0 }
     */
    public function toggleSpotlightActive(Request $request)
    {
        $id = intval($request->input('id', 0));
        $value = $request->input('spotlight_active');

        if (!$id || !in_array($value, [0, 1, '0', '1'], true)) {
            return response()->json([
                "status" => false,
                "message" => "Invalid data"
            ]);
        }

        DB::beginTransaction();
        try {
            $category = Category::where('id', $id)->where('is_deleted', 0)->first();
            if (!$category) {
                return response()->json([
                    "status" => false,
                    "message" => "Category not found"
                ]);
            }

            if ((int) $value === 1) {
                // Ensure exclusivity: deactivate every other category first
                Category::where('id', '!=', $id)->update(['spotlight_active' => 0]);
                $category->update(['spotlight_active' => 1]);
            } else {
                $category->update(['spotlight_active' => 0]);
            }

            DB::commit();
            $this->forgetStorefrontCache($category->company_id);
            return response()->json([
                "status" => true,
                "message" => "Spotlight category updated successfully",
                "data" => ["id" => $id, "spotlight_active" => (int) $value]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                "status" => false,
                "message" => $e->getMessage()
            ]);
        }
    }

    /**
     * Active category for the "IN THE SPOTLIGHT" homepage section.
     *
     * GET /api/category/spotlight?company_id=1
     *
     * Returns the single admin-selected spotlight category together with its
     * 2 latest products. If none is selected, falls back to the latest active
     * category so the section always has content.
     */
    public function spotlight(Request $request)
    {
        $company_id = intval($request->input('company_id') ?: $request->query('company_id', 0));

        $key = $this->cacheKey('spotlight', $company_id);
        $payload = Cache::remember($key, 300, function () use ($company_id) {
            $baseQuery = Category::where('status', 'active')
                ->where('is_deleted', 0);

            if ($company_id > 0) {
                $baseQuery->where('company_id', $company_id);
            }

            // Prefer the admin-selected spotlight category
            $category = (clone $baseQuery)
                ->where('spotlight_active', 1)
                ->latest()
                ->first(['id', 'name', 'image']);

            // Fallback: the newest active category
            if (!$category) {
                $category = (clone $baseQuery)
                    ->latest()
                    ->first(['id', 'name', 'image']);
            }

            if (!$category) {
                return ['__none__' => true];
            }

            $products = Product::where('is_deleted', 0)
                ->where('active_status', '!=', 'inactive')
                ->where('category_id', $category->id)
                ->orderBy('created_at', 'desc')
                ->limit(2)
                ->get(['id', 'product_name', 'image', 'video_url', 'price']);

            return [
                'id' => $category->id,
                'category_name' => $category->name,
                'image' => $category->image,
                'image_src' => $category->image_src,
                'products' => $products->map(function ($p) {
                    return $this->mapProduct($p);
                }),
            ];
        });

        if (is_array($payload) && isset($payload['__none__'])) {
            return response()->json([
                "status" => true,
                "data" => null,
                "message" => "No categories available"
            ]);
        }

        return response()->json([
            "status" => true,
            "data" => $payload
        ]);
    }

    /** Cache key for the storefront category endpoints. */
    private function cacheKey(string $suffix, int $companyId): string
    {
        return 'storefront.categories.' . $suffix . '.' . $companyId;
    }

    /** Drop cached category/spotlight data so the next storefront request is fresh. */
    private function forgetStorefrontCache(int $companyId): void
    {
        Cache::forget($this->cacheKey('active', $companyId));
        Cache::forget($this->cacheKey('all', $companyId));
        Cache::forget($this->cacheKey('spotlight', $companyId));
    }

    /**
     * Normalise a product row into the storefront card payload.
     * (Shared by the spotlight payload to avoid duplicated mapping.)
     */
    private function mapProduct($p): array
    {
        $offer = (float) $p->price;
        $original = (float) $p->price;
        $discount = 0;

        return [
            'id' => $p->id,
            'product_name' => $p->product_name,
            'image' => $p->image,
            'image_src' => $p->image_src,
            'video_url' => $p->video_url,
            'price' => $original,
            'offer_price' => $offer,
            'original_price' => $original,
            'discount_percentage' => $discount,
        ];
    }
}
