<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\CelebrationBanner;
use Illuminate\Support\Facades\Cache;

class CelebrationBannerController extends Controller
{
    /** Maximum total number of celebration banners. */
    private const MAX_TOTAL_BANNERS = 1;

    /** Message returned when the total banner limit is reached. */
    private const TOTAL_LIMIT_MESSAGE =
        "Only 1 celebration banner can be added. Please delete the existing banner first.";
    /**
     * List all celebration banners (admin panel).
     *
     * GET /api/celebration-banners/get_all?search=
     */
    public function getAll(Request $request)
    {
        $search = trim($request->input('search') ?: $request->query('search', ''));

        $query = CelebrationBanner::query();

        if ($search !== '') {
            $query->where('banner_name', 'like', "%{$search}%");
        }

        $banners = $query->orderBy('id', 'desc')->get();

        return response()->json([
            "status" => true,
            "data" => $banners
        ]);
    }

    /**
     * Active banners for the storefront "CRAFTED FOR CELEBRATION" section.
     *
     * GET /api/celebration-banners/get_active
     *
     * Returns only active banners, ordered by newest first.
     * The frontend renders the first one.
     */
    public function getActive(Request $request)
    {
        $key = 'storefront.banners.celebration.active';
        $banners = Cache::remember($key, 300, function () {
            return CelebrationBanner::where('is_active', 1)
                ->orderBy('id', 'desc')
                ->get();
        });

        return response()->json([
            "status" => true,
            "data" => $banners
        ]);
    }

    /**
     * Get a single celebration banner by id.
     *
     * GET /api/celebration-banners/get_by_id?id=1
     */
    public function getById(Request $request)
    {
        $id = intval($request->input('id') ?: $request->query('id', 0));
        $banner = CelebrationBanner::where('id', $id)->first();

        if (!$banner) {
            return response()->json([
                "status" => false,
                "message" => "Banner not found"
            ]);
        }

        return response()->json([
            "status" => true,
            "data" => $banner
        ]);
    }

    /**
     * Create a new celebration banner (stores the image URL only).
     *
     * POST /api/celebration-banners/create
     * Fields: banner_name, image_url, is_active
     */
    public function create(Request $request)
    {
        $banner_name = trim($request->input('banner_name', ''));

        if (!$banner_name) {
            return response()->json([
                "status" => false,
                "message" => "Banner name is required"
            ]);
        }

        $image_url = trim($request->input('image_url', ''));
        $validated = $this->validateImageUrl($image_url);
        if ($validated !== true) {
            return response()->json([
                "status" => false,
                "message" => $validated
            ]);
        }

        if (CelebrationBanner::count() >= self::MAX_TOTAL_BANNERS) {
            return response()->json([
                "status" => false,
                "message" => self::TOTAL_LIMIT_MESSAGE,
            ], 422);
        }

        $banner = CelebrationBanner::create([
            'banner_name' => $banner_name,
            'image_url' => $image_url,
            'is_active' => $request->input('is_active', 1) ? 1 : 0,
        ]);

        Cache::forget('storefront.banners.celebration.active');

        return response()->json([
            "status" => true,
            "message" => "Banner created successfully",
            "data" => $banner
        ]);
    }

    /**
     * Update an existing celebration banner (image_url is optional on update).
     *
     * POST /api/celebration-banners/update
     * Fields: id, banner_name, image_url (optional), is_active
     */
    public function update(Request $request)
    {
        $id = intval($request->input('id', 0));
        $banner = CelebrationBanner::where('id', $id)->first();

        if (!$banner) {
            return response()->json([
                "status" => false,
                "message" => "Banner not found"
            ]);
        }

        $banner_name = trim($request->input('banner_name', ''));

        if (!$banner_name) {
            return response()->json([
                "status" => false,
                "message" => "Banner name is required"
            ]);
        }

        $updateData = [
            'banner_name' => $banner_name,
            'is_active' => $request->input('is_active', $banner->is_active) ? 1 : 0,
        ];

        if ($request->filled('image_url')) {
            $image_url = trim($request->input('image_url'));
            $validated = $this->validateImageUrl($image_url);
            if ($validated !== true) {
                return response()->json([
                    "status" => false,
                    "message" => $validated
                ]);
            }
            $updateData['image_url'] = $image_url;
        }

        $banner->update($updateData);

        Cache::forget('storefront.banners.celebration.active');

        return response()->json([
            "status" => true,
            "message" => "Banner updated successfully",
            "data" => $banner
        ]);
    }

    /**
     * Delete a celebration banner.
     *
     * POST /api/celebration-banners/delete  Body: { id: 1 }
     */
    public function delete(Request $request)
    {
        $id = intval($request->input('id', 0));
        if (!$id) {
            return response()->json([
                "status" => false,
                "message" => "ID required"
            ]);
        }

        $banner = CelebrationBanner::where('id', $id)->first();
        if (!$banner) {
            return response()->json([
                "status" => false,
                "message" => "Banner not found"
            ]);
        }

        $banner->delete();

        Cache::forget('storefront.banners.celebration.active');

        return response()->json([
            "status" => true,
            "message" => "Banner deleted successfully"
        ]);
    }

    /**
     * Toggle celebration banner active/inactive status.
     *
     * POST /api/celebration-banners/toggle_status  Body: { id: 1, is_active: 1 | 0 }
     */
    public function toggleStatus(Request $request)
    {
        $id = intval($request->input('id', 0));
        $isActive = $request->input('is_active');

        if (!$id || !in_array($isActive, [0, 1, '0', '1'], true)) {
            return response()->json([
                "status" => false,
                "message" => "Invalid data"
            ]);
        }

        $banner = CelebrationBanner::where('id', $id)->first();
        if (!$banner) {
            return response()->json([
                "status" => false,
                "message" => "Banner not found"
            ]);
        }

        $banner->update(['is_active' => (int) $isActive]);

        Cache::forget('storefront.banners.celebration.active');

        return response()->json([
            "status" => true,
            "message" => "Banner status updated successfully"
        ]);
    }

    /**
     * Validate a banner image URL.
     *
     * Returns true when valid, otherwise an error message string.
     * Must be an HTTPS/HTTP URL pointing to jpg, jpeg, png, webp or avif.
     */
    private function validateImageUrl($url)
    {
        $url = trim($url ?? '');
        if ($url === '') {
            return "Image URL is required";
        }

        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return "Image URL must be a valid URL";
        }

        $scheme = strtolower(parse_url($url, PHP_URL_SCHEME) ?? '');
        if (!in_array($scheme, ['http', 'https'], true)) {
            return "Image URL must start with http or https";
        }

        $path = parse_url($url, PHP_URL_PATH) ?? '';
        if (!preg_match('/\.(jpe?g|png|webp|avif)$/i', $path)) {
            return "Image URL must point to a JPG, JPEG, PNG, WEBP or AVIF image";
        }

        return true;
    }
}
