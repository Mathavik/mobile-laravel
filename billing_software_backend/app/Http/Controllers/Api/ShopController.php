<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ShopController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query()
            ->where('is_deleted', 0)
            ->where(function ($q) {
                $q->where('active_status', '=', 'active')
                  ->orWhereNull('active_status');
            });

        // If category_id is provided, use the category's company_id
        if ($request->filled('category_id') && $request->category_id > 0) {
            $category = Category::find($request->category_id);
            if ($category) {
                $query->where('category_id', $request->category_id);
                $query->where('company_id', $category->company_id);
            }
        } else {
            // Only filter by company_id if no category is selected
            if ($request->filled('company_id') && $request->company_id > 0) {
                $query->where('company_id', $request->company_id);
            }
        }

        // ── Product filters (combined together, e.g. AND across groups) ──
        if ($request->filled('brand_id') && $request->brand_id > 0) {
            $query->where('brand_id', intval($request->brand_id));
        }

        $color = trim((string) $request->query('color', ''));
        if ($color !== '') {
            $query->where('color', 'like', "%{$color}%");
        }

        if ($request->filled('min_price')) {
            $query->where('price', '>=', floatval($request->min_price));
        }
        if ($request->filled('max_price')) {
            $query->where('price', '<=', floatval($request->max_price));
        }

        $sizes = $this->normalizeList($request->input('sizes'));
        if (count($sizes) > 0) {
            $query->where(function ($q) use ($sizes) {
                foreach ($sizes as $size) {
                    $q->orWhere('available_sizes', 'like', "%{$size}%");
                }
            });
        }

        $availability = trim((string) $request->query('availability', ''));
        if ($availability === 'in_stock') {
            $query->where('stock', '>', 0);
        } elseif ($availability === 'out_of_stock') {
            $query->where(function ($q) {
                $q->where('stock', '<=', 0)->orWhereNull('stock');
            });
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('product_name', 'like', "%{$search}%")
                    ->orWhere('product_code', 'like', "%{$search}%")
                    ->orWhere('keywords', 'like', "%{$search}%")
                    ->orWhere('short_description', 'like', "%{$search}%")
                    ->orWhereHas('keywords', function ($kw) use ($search) {
                        $kw->where('keyword', 'like', "%{$search}%");
                    });
            });
        }

        $sort = trim((string) $request->query('sort', ''));
        switch ($sort) {
            case 'price_low':
            case 'price_asc':
                $query->orderBy('price', 'asc');
                break;
            case 'price_high':
            case 'price_desc':
                $query->orderBy('price', 'desc');
                break;
            case 'popular':
            case 'rating':
                $query->orderBy('view_count', 'desc')->orderBy('created_at', 'desc');
                break;
            case 'newest':
            default:
                $query->orderBy('created_at', 'desc');
                break;
        }

        $perPage = (int) ($request->per_page ?: 12);
        $products = $query->paginate($perPage);

        return $this->successResponse($products, 'Products fetched successfully');
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

    public function show(Request $request, $id)
    {
        $product = Product::where('id', $id)->where('is_deleted', 0)->first();

        if (!$product) {
            return $this->errorResponse('Product not found', 404);
        }

        $product->increment('view_count');
        $product->keywords_list = $product->keywordList();

        return $this->successResponse($product, 'Product fetched successfully');
    }

    public function store(Request $request)
    {
        $data = $this->validateProduct($request, 'create');
        $data['is_deleted'] = 0;
        $data['active_status'] = $data['active_status'] ?? 'active';
        $data['view_count'] = 0;

        if ($request->hasFile('image')) {
            $data['image'] = $this->uploadFile($request->file('image'));
        }

        if ($request->hasFile('gallery_images')) {
            $gallery = [];
            foreach ($request->file('gallery_images') as $file) {
                $gallery[] = $this->uploadFile($file);
            }
            $data['image_gallery_json'] = json_encode($gallery);
        }

        $product = Product::create($data);

        return $this->successResponse($product, 'Product added successfully', 201);
    }

    public function update(Request $request, $id)
    {
        $product = Product::where('id', $id)->where('is_deleted', 0)->first();
        if (!$product) {
            return $this->errorResponse('Product not found', 404);
        }

        $data = $this->validateProduct($request, 'update');

        if ($request->hasFile('image')) {
            $data['image'] = $this->uploadFile($request->file('image'));
        }

        if ($request->hasFile('gallery_images')) {
            $gallery = [];
            foreach ($request->file('gallery_images') as $file) {
                $gallery[] = $this->uploadFile($file);
            }
            $data['image_gallery_json'] = json_encode($gallery);
        }

        $product->fill($data);
        $product->save();

        return $this->successResponse($product, 'Product updated successfully');
    }

    public function destroy($id)
    {
        $product = Product::find($id);
        if (!$product) {
            return $this->errorResponse('Product not found', 404);
        }

        $product->update(['is_deleted' => 1]);

        return $this->successResponse([], 'Product deleted successfully');
    }

    public function toggleStatus(Request $request, $id)
    {
        $product = Product::where('id', $id)->where('is_deleted', 0)->first();
        if (!$product) {
            return $this->errorResponse('Product not found', 404);
        }

        $status = $request->input('active_status', 'active');
        $product->update(['active_status' => $status]);

        return $this->successResponse($product, 'Product status updated successfully');
    }

    public function search(Request $request)
    {
        $query = trim($request->query('search', ''));
        if (!$query) {
            return $this->successResponse([], 'No search term provided');
        }

        $productQuery = Product::where('is_deleted', 0)
            ->where(function ($q) {
                $q->where('active_status', '=', 'active')
                  ->orWhereNull('active_status');
            })
            ->where(function ($q) use ($query) {
                $q->where('product_name', 'like', "%{$query}%")
                    ->orWhere('product_code', 'like', "%{$query}%")
                    ->orWhere('keywords', 'like', "%{$query}%")
                    ->orWhereHas('keywords', function ($kw) use ($query) {
                        $kw->where('keyword', 'like', "%{$query}%");
                    });
            });

        // If category_id is provided, get the category's company_id
        if ($request->filled('category_id') && $request->category_id > 0) {
            $category = Category::find($request->category_id);
            if ($category) {
                $productQuery->where('category_id', $request->category_id);
                $productQuery->where('company_id', $category->company_id);
            }
        } else {
            // Only filter by company_id if no category is selected
            if ($request->filled('company_id') && $request->company_id > 0) {
                $productQuery->where('company_id', $request->company_id);
            }
        }

        $products = $productQuery->orderBy('created_at', 'desc')->paginate(12);

        return $this->successResponse($products, 'Products searched successfully');
    }

    public function filters(Request $request)
    {
        $query = Product::where('is_deleted', 0)
            ->where(function ($q) {
                $q->where('active_status', '=', 'active')
                  ->orWhereNull('active_status');
            });

        // If category_id is provided, get the category's company_id
        if ($request->filled('category_id') && $request->category_id > 0) {
            $category = Category::find($request->category_id);
            if ($category) {
                $query->where('category_id', $request->category_id);
                $query->where('company_id', $category->company_id);
            }
        } else {
            // Only filter by company_id if no category is selected
            if ($request->filled('company_id') && $request->company_id > 0) {
                $query->where('company_id', $request->company_id);
            }
        }

        $products = $query->select('category_id', 'occasion', 'fabric', 'color', 'price')->get();

        $filters = [
            'categories' => $products->pluck('category_id')->filter()->unique()->values(),
            'occasions' => $products->pluck('occasion')->filter()->unique()->values(),
            'fabrics' => $products->pluck('fabric')->filter()->unique()->values(),
            'colors' => $products->pluck('color')->filter()->unique()->values(),
            'price_range' => [
                'min' => (int) $products->min('price'),
                'max' => (int) $products->max('price'),
            ],
        ];

        return $this->successResponse($filters, 'Filters fetched successfully');
    }

    private function validateProduct(Request $request, string $mode): array
    {
        $rules = [
            'product_name' => 'required|string|max:150',
            'product_code' => 'nullable|string|max:100',
            'category_id' => 'nullable|integer',
            'price' => 'required|numeric|min:0',
            'stock' => 'nullable|integer|min:0',
            'barcode' => 'nullable|string|max:100',
            'unit' => 'nullable|string|max:20',
            'gst_percentage' => 'nullable|numeric|min:0|max:100',
            'company_id' => 'nullable|integer',
            'short_description' => 'nullable|string',
            'full_description' => 'nullable|string',
            'fabric' => 'nullable|string',
            'embroidery' => 'nullable|string',
            'color' => 'nullable|string',
            'available_sizes' => 'nullable|string',
            'occasion' => 'nullable|string',
            'active_status' => 'nullable|in:active,inactive',
            'keywords' => 'nullable|string',
            'video_url' => 'nullable|url',
            'image' => $mode === 'create' ? 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048' : 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'gallery_images' => 'nullable|array',
            'gallery_images.*' => 'image|mimes:jpg,jpeg,png,webp|max:2048',
        ];

        $data = $request->validate($rules);

        if ($request->filled('image_gallery_json')) {
            $data['image_gallery_json'] = $request->input('image_gallery_json');
        }

        return $data;
    }

    private function uploadFile($file): string
    {
        $path = $file->store('products', 'public');
        return 'storage/' . $path;
    }

    private function successResponse($data, string $message, int $statusCode = 200): \Illuminate\Http\JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $statusCode);
    }

    private function errorResponse(string $message, int $statusCode = 422): \Illuminate\Http\JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], $statusCode);
    }
}
