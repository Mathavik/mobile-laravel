<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\HomePageBanner;
use Illuminate\Support\Facades\Cache;

class HomePageBannerController extends Controller
{
    /** Maximum number of banners that may be active at the same time. */
    private const MAX_ACTIVE_BANNERS = 2;

    /** Maximum total number of banners per company. */
    private const MAX_TOTAL_BANNERS = 2;

    /** Cache key for the storefront active-banner list (shared across companies). */
    private const ACTIVE_CACHE_KEY = 'storefront.banners.active';

    /** Message returned when the total banner limit is reached. */
    private const TOTAL_LIMIT_MESSAGE =
        "Only 2 banners can be added. Please delete an existing banner first.";

    /** Message returned when the active banner limit would be exceeded. */
    private const ACTIVE_LIMIT_MESSAGE =
        "Only 2 banners can be active at a time. " .
        "Please deactivate one of the existing active banners first.";

    /**
     * Count active banners, optionally scoped to a company and excluding a banner.
     */
    private function activeBannerCount($companyId = null, $excludeId = null)
    {
        $query = HomePageBanner::where('is_active', 1);

        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->count();
    }

    /**
     * Count total banners for a company (all statuses).
     */
    private function totalBannerCount($companyId)
    {
        return HomePageBanner::where('company_id', $companyId)->count();
    }

    /**
     * List all banners for a company (admin panel).
     *
     * GET /api/home-page-banners/get_all?company_id=1&search=
     */
    public function getAll(Request $request)
    {
        $company_id = intval($request->input('company_id') ?: $request->query('company_id', 0));
        $search = trim($request->input('search') ?: $request->query('search', ''));

        $query = HomePageBanner::query();

        if ($company_id > 0) {
            $query->where('company_id', $company_id);
        }

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
     * Active banners for the storefront "EDITOR'S PICK" section.
     *
     * GET /api/home-page-banners/get_active
     *
     * Returns only active banners (not scoped to a company), ordered by
     * newest first, limited to the first 2.
     */
    public function getActive(Request $request)
    {
        $banners = Cache::remember(self::ACTIVE_CACHE_KEY, 300, function () {
            return HomePageBanner::where('is_active', 1)
                ->orderBy('id', 'desc')
                ->limit(2)
                ->get();
        });

        return response()->json([
            "status" => true,
            "data" => $banners
        ]);
    }

    /**
     * Get a single banner by id.
     *
     * GET /api/home-page-banners/get_by_id?id=1
     */
    public function getById(Request $request)
    {
        $id = intval($request->input('id') ?: $request->query('id', 0));
        $banner = HomePageBanner::where('id', $id)->first();

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
     * Create a new banner (stores the image URL only).
     *
     * POST /api/home-page-banners/create
     * Fields: banner_name, image_url, collection_id, is_active, company_id
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

        $companyId = intval($request->input('company_id', 0)) ?: null;

        if ($companyId && $this->totalBannerCount($companyId) >= self::MAX_TOTAL_BANNERS) {
            return response()->json([
                "status" => false,
                "message" => self::TOTAL_LIMIT_MESSAGE,
            ], 422);
        }

        $requestedActive = $request->input('is_active', 1) ? 1 : 0;
        $limitReached = ($this->activeBannerCount($companyId) + ($requestedActive ? 1 : 0)) > self::MAX_ACTIVE_BANNERS;

        $banner = HomePageBanner::create([
            'company_id' => $companyId,
            'banner_name' => $banner_name,
            'image_url' => $image_url,
            'collection_id' => $request->input('collection_id') ? intval($request->input('collection_id')) : null,
            'is_active' => $limitReached ? 0 : $requestedActive,
        ]);

        $response = [
            "status" => true,
            "message" => "Banner created successfully",
            "data" => $banner,
        ];

        if ($limitReached) {
            $response['activeLimitReached'] = true;
            $response['warning'] = self::ACTIVE_LIMIT_MESSAGE;
        }

        Cache::forget(self::ACTIVE_CACHE_KEY);

        return response()->json($response);
    }

    /**
     * Update an existing banner (image_url is optional on update).
     *
     * POST /api/home-page-banners/update
     * Fields: id, banner_name, image_url (optional), collection_id, is_active
     */
    public function update(Request $request)
    {
        $id = intval($request->input('id', 0));
        $banner = HomePageBanner::where('id', $id)->first();

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

        $requestedActive = $request->input('is_active', $banner->is_active) ? 1 : 0;
        $limitReached = ($this->activeBannerCount($banner->company_id, $banner->id) + ($requestedActive ? 1 : 0)) > self::MAX_ACTIVE_BANNERS;

        $updateData = [
            'banner_name' => $banner_name,
            'collection_id' => $request->input('collection_id') ? intval($request->input('collection_id')) : null,
            'is_active' => $limitReached ? ($banner->is_active ? 1 : 0) : $requestedActive,
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

        $response = [
            "status" => true,
            "message" => "Banner updated successfully",
            "data" => $banner,
        ];

        if ($limitReached) {
            $response['activeLimitReached'] = true;
            $response['warning'] = self::ACTIVE_LIMIT_MESSAGE;
        }

        Cache::forget(self::ACTIVE_CACHE_KEY);

        return response()->json($response);
    }

    /**
     * Delete a banner.
     *
     * POST /api/home-page-banners/delete  Body: { id: 1 }
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

        $banner = HomePageBanner::where('id', $id)->first();
        if (!$banner) {
            return response()->json([
                "status" => false,
                "message" => "Banner not found"
            ]);
        }

        $banner->delete();

        Cache::forget(self::ACTIVE_CACHE_KEY);

        return response()->json([
            "status" => true,
            "message" => "Banner deleted successfully"
        ]);
    }

    /**
     * Toggle banner active/inactive status.
     *
     * POST /api/home-page-banners/toggle_status  Body: { id: 1, is_active: 1 | 0 }
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

        $banner = HomePageBanner::where('id', $id)->first();
        if (!$banner) {
            return response()->json([
                "status" => false,
                "message" => "Banner not found"
            ]);
        }

        $newActive = (int) $isActive;

        if ($newActive === 1 && $this->activeBannerCount($banner->company_id, $banner->id) >= self::MAX_ACTIVE_BANNERS) {
            return response()->json([
                "status" => false,
                "message" => self::ACTIVE_LIMIT_MESSAGE
            ]);
        }

        $banner->update(['is_active' => $newActive]);

        Cache::forget(self::ACTIVE_CACHE_KEY);

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
