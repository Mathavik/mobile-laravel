<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ProductController extends Controller
{
    private function normalizeGalleryJson($value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_array($value)) {
            return json_encode($value);
        }

        if (is_string($value)) {
            $trimmed = trim($value);
            if ($trimmed === '') {
                return null;
            }

            $decoded = json_decode($trimmed, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return json_encode($decoded);
            }

            $parts = array_values(array_filter(array_map('trim', preg_split('/[\n,]+/', $trimmed) ?: [])));
            return $parts ? json_encode($parts) : null;
        }

        return (string) $value;
    }

    private function buildProductPayload(array $data): array
    {
        $payload = [
            'product_name' => $data['product_name'] ?? null,
            'product_code' => $data['product_code'] ?? null,
            'category_id' => $data['category_id'] ?? null,
            'subcategory_id' => $data['subcategory_id'] ?? null,
            'brand_id' => $data['brand_id'] ?? null,
            'price' => $data['price'] ?? 0,
            'stock' => $data['stock'] ?? 0,
            'barcode' => $data['barcode'] ?? null,
            'unit' => $data['unit'] ?? null,
            'gst_percentage' => $data['gst_percentage'] ?? 0,
            'company_id' => $data['company_id'] ?? null,
            'supplier_id' => $data['supplier_id'] ?? null,
            'status' => $data['status'] ?? 'active',
            'is_deleted' => $data['is_deleted'] ?? 0,
        ];

        $existingColumns = Schema::hasTable('products') ? Schema::getColumnListing('products') : [];

        $optionalColumns = [
            'image' => $data['image'] ?? null,
            'image_gallery_json' => $data['image_gallery_json'] ?? null,
            'video_url' => $data['video_url'] ?? null,
            'short_description' => $data['short_description'] ?? null,
            'full_description' => $data['full_description'] ?? null,
            'fabric' => $data['fabric'] ?? null,
            'embroidery' => $data['embroidery'] ?? null,
            'color' => $data['color'] ?? null,
            'available_sizes' => $data['available_sizes'] ?? null,
            'occasion' => $data['occasion'] ?? null,
            'active_status' => $data['active_status'] ?? 'active',
            'view_count' => $data['view_count'] ?? 0,
            'keywords' => $data['keywords'] ?? null,
        ];

        foreach ($optionalColumns as $column => $value) {
            if (in_array($column, $existingColumns, true)) {
                $payload[$column] = $value;
            }
        }

        return $payload;
    }

    public function add(Request $request)
    {
        $product_name    = trim($request->input('product_name', ''));
        $product_code    = trim($request->input('product_code', ''));
        $category_id     = intval($request->input('category_id', 0));
        $subcategory_id  = intval($request->input('subcategory_id', 0));
        $brand_id        = intval($request->input('brand_id', 0));
        $price           = floatval($request->input('price', 0));
        $stock           = intval($request->input('stock', 0));
        $barcode         = trim($request->input('barcode', ''));
        $unit            = trim($request->input('unit', ''));
        $gst_percentage  = floatval($request->input('gst_percentage', 0));
        $company_id      = intval($request->input('company_id', 0));
        $supplier_id     = intval($request->input('supplier_id', 0));
        $image           = trim($request->input('image', ''));
        $image_gallery   = $this->normalizeGalleryJson($request->input('image_gallery_json', null));
        $video_url       = trim($request->input('video_url', ''));
        $short_desc      = trim($request->input('short_description', ''));
        $full_desc       = trim($request->input('full_description', ''));
        $fabric          = trim($request->input('fabric', ''));
        $embroidery      = trim($request->input('embroidery', ''));
        $color           = trim($request->input('color', ''));
        $available_sizes = trim($request->input('available_sizes', ''));
        $occasion        = trim($request->input('occasion', ''));
        $active_status   = trim($request->input('active_status', 'active')) ?: 'active';
        $view_count      = intval($request->input('view_count', 0));
        $keywordList     = Product::normalizeKeywords($request->input('keywords', ''));
        $is_deleted      = intval($request->input('is_deleted', 0));

        if (!$product_name || !$company_id) {
            return response()->json([
                "status" => false,
                "message" => "Product Name and Company ID required"
            ]);
        }

        $payload = $this->buildProductPayload([
            'product_name' => $product_name,
            'product_code' => $product_code ?: null,
            'category_id' => $category_id ?: null,
            'subcategory_id' => $subcategory_id ?: null,
            'brand_id' => $brand_id ?: null,
            'price' => $price,
            'stock' => $stock,
            'barcode' => $barcode ?: null,
            'unit' => $unit ?: null,
            'gst_percentage' => $gst_percentage,
            'company_id' => $company_id,
            'supplier_id' => $supplier_id ?: null,
            'image' => $image ?: null,
            'image_gallery_json' => $image_gallery,
            'video_url' => $video_url ?: null,
            'short_description' => $short_desc ?: null,
            'full_description' => $full_desc ?: null,
            'fabric' => $fabric ?: null,
            'embroidery' => $embroidery ?: null,
            'color' => $color ?: null,
            'available_sizes' => $available_sizes ?: null,
            'occasion' => $occasion ?: null,
            'active_status' => $active_status,
            'view_count' => $view_count,
            'keywords' => $keywordList ? implode(', ', $keywordList) : null,
            'status' => $active_status,
            'is_deleted' => $is_deleted,
        ]);

        $product = Product::create($payload);
        Product::syncKeywords($product->id, $keywordList);

        return response()->json([
            "status" => true,
            "message" => "Product created successfully"
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

        Product::where('id', $id)->delete();

        return response()->json([
            "status" => true,
            "message" => "Product permanently deleted"
        ]);
    }

    public function get(Request $request)
    {
        $company_id = intval($request->input('company_id') ?: $request->query('company_id', 0));
        $brand_id = intval($request->input('brand_id') ?: $request->query('brand_id', 0));

        if (!$company_id) {
            return response()->json([
                "status" => true,
                "data" => []
            ]);
        }

        $query = DB::table('products as p')
            ->leftJoin('categories as c', 'p.category_id', '=', 'c.id')
            ->leftJoin('subcategories as sc', 'p.subcategory_id', '=', 'sc.id')
            ->leftJoin('brands as b', 'p.brand_id', '=', 'b.id')
            ->leftJoin('companies as comp', 'p.company_id', '=', 'comp.id')
            ->leftJoin('suppliers as sup', 'p.supplier_id', '=', 'sup.id')
            ->select(
                'p.*',
                'c.name as category_name',
                'sc.name as subcategory_name',
                'b.name as brand_name',
                'comp.company_name',
                'comp.gstin as company_gstin',
                'comp.gst_type',
                'sup.supplier_name'
            )
            ->where('p.company_id', $company_id)
            ->where('p.is_deleted', 0);

        if ($brand_id > 0) {
            $query->where('p.brand_id', $brand_id);
        }

        $products = $query->orderBy('p.id', 'desc')->get();

        return response()->json([
            "status" => true,
            "data" => $products
        ]);
    }

    public function getById(Request $request)
    {
        $id = intval($request->input('id') ?: $request->query('id', 0));
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                "status" => false,
                "message" => "Product not found"
            ]);
        }

        $product->keywords_list = $product->keywordList();

        return response()->json([
            "status" => true,
            "data" => $product
        ]);
    }

    public function getBySupplier(Request $request)
    {
        $supplier_id = intval($request->input('supplier_id') ?: $request->query('supplier_id', 0));

        if (!$supplier_id) {
            return response()->json(["status" => false, "message" => "supplier_id required"]);
        }

        $products = DB::table('products as p')
            ->leftJoin('companies as c', 'p.company_id', '=', 'c.id')
            ->leftJoin('categories as cat', 'p.category_id', '=', 'cat.id')
            ->select('p.*', 'c.company_name', 'cat.name as category_name')
            ->where('p.supplier_id', $supplier_id)
            ->where('p.is_deleted', 0)
            ->orderBy('p.id', 'desc')
            ->get();

        return response()->json(["status" => true, "data" => $products]);
    }

    public function toggleStatusProduct(Request $request)
    {
        $id = intval($request->input('id', 0));
        $status = $request->input('status', '');

        if (!$id || !$status) {
            return response()->json(["status" => false, "message" => "Invalid data"]);
        }

        Product::where('id', $id)->update(['status' => $status]);

        return response()->json(["status" => true, "message" => "Status updated successfully"]);
    }

    public function getByCode(Request $request)
    {
        $company_id   = intval($request->query('company_id', 0));
        $product_code = trim($request->query('product_code', ''));

        if (!$company_id || !$product_code) {
            return response()->json(["status" => false, "message" => "company_id and product_code required"]);
        }

        $product = DB::table('products as p')
            ->leftJoin('categories as c', 'p.category_id', '=', 'c.id')
            ->leftJoin('subcategories as sc', 'p.subcategory_id', '=', 'sc.id')
            ->leftJoin('brands as b', 'p.brand_id', '=', 'b.id')
            ->select(
                'p.id',
                'p.product_name',
                'p.product_code',
                'p.barcode',
                'p.price',
                'p.unit',
                'p.gst_percentage',
                'p.category_id',
                'p.subcategory_id',
                'p.brand_id',
                'c.name as category_name',
                'sc.name as subcategory_name',
                'b.name as brand_name'
            )
            ->where('p.company_id', $company_id)
            ->where('p.product_code', $product_code)
            ->where('p.is_deleted', 0)
            ->first();

        if (!$product) {
            return response()->json(["status" => false, "message" => "Product not found"]);
        }

        return response()->json(["status" => true, "data" => $product]);
    }

    public function update(Request $request)
    {
        $id             = intval($request->input('id', 0));
        $product_name   = trim($request->input('product_name', ''));
        $product_code   = trim($request->input('product_code', ''));
        $category_id    = intval($request->input('category_id', 0));
        $subcategory_id = intval($request->input('subcategory_id', 0));
        $brand_id       = intval($request->input('brand_id', 0));
        $price          = floatval($request->input('price', 0));
        $stock          = intval($request->input('stock', 0));
        $barcode        = trim($request->input('barcode', ''));
        $unit           = trim($request->input('unit', ''));
        $gst_percentage = floatval($request->input('gst_percentage', 0));
        $company_id     = intval($request->input('company_id', 0));
        $supplier_id    = intval($request->input('supplier_id', 0));
        $image          = trim($request->input('image', ''));
        $image_gallery  = $this->normalizeGalleryJson($request->input('image_gallery_json', null));
        $video_url      = trim($request->input('video_url', ''));
        $short_desc     = trim($request->input('short_description', ''));
        $full_desc      = trim($request->input('full_description', ''));
        $fabric         = trim($request->input('fabric', ''));
        $embroidery     = trim($request->input('embroidery', ''));
        $color          = trim($request->input('color', ''));
        $available_sizes = trim($request->input('available_sizes', ''));
        $occasion       = trim($request->input('occasion', ''));
        $active_status  = trim($request->input('active_status', 'active')) ?: 'active';
        $view_count     = intval($request->input('view_count', 0));
        $keywordList    = Product::normalizeKeywords($request->input('keywords', ''));
        $is_deleted     = intval($request->input('is_deleted', 0));

        if (!$id || !$product_name) {
            return response()->json(["status" => false, "message" => "ID and Product Name required"]);
        }

        $existingProduct = Product::find($id);
        if (!$existingProduct) {
            return response()->json(["status" => false, "message" => "Product not found"]);
        }

        // Preserve the product's existing company_id when the request does not
        // explicitly supply one, instead of letting it default to NULL. This
        // prevents the product from silently disappearing from company-scoped
        // listings (e.g. the Admin Products page) after an update.
        $company_id = $company_id ?: $existingProduct->company_id;

        $payload = $this->buildProductPayload([
            'product_name' => $product_name,
            'product_code' => $product_code ?: null,
            'category_id' => $category_id ?: null,
            'subcategory_id' => $subcategory_id ?: null,
            'brand_id' => $brand_id ?: null,
            'price' => $price,
            'stock' => $stock,
            'barcode' => $barcode ?: null,
            'unit' => $unit ?: null,
            'gst_percentage' => $gst_percentage,
            'company_id' => $company_id ?: null,
            'supplier_id' => $supplier_id ?: null,
            'image' => $image ?: null,
            'image_gallery_json' => $image_gallery,
            'video_url' => $video_url ?: null,
            'short_description' => $short_desc ?: null,
            'full_description' => $full_desc ?: null,
            'fabric' => $fabric ?: null,
            'embroidery' => $embroidery ?: null,
            'color' => $color ?: null,
            'available_sizes' => $available_sizes ?: null,
            'occasion' => $occasion ?: null,
            'active_status' => $active_status,
            'view_count' => $view_count,
            'keywords' => $keywordList ? implode(', ', $keywordList) : null,
            'status' => $active_status,
            'is_deleted' => $is_deleted,
        ]);

        Product::where('id', $id)->update($payload);
        Product::syncKeywords($id, $keywordList);

        return response()->json(["status" => true, "message" => "Product updated successfully"]);
    }
}
