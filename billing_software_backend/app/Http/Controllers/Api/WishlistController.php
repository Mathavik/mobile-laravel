<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class WishlistController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->input('user_id') ?: $request->query('user_id');
        if (!$userId) {
            return $this->errorResponse('User ID is required', 422);
        }

        $items = DB::table('wishlists')
            ->leftJoin('products', 'wishlists.product_id', '=', 'products.id')
            ->where('wishlists.user_id', $userId)
            ->select('wishlists.*', 'products.product_name', 'products.price', 'products.image', 'products.video_url', 'products.stock', 'products.gst_percentage')
            ->orderBy('wishlists.created_at', 'desc')
            ->get();

        return $this->successResponse($items, 'Wishlist fetched successfully');
    }

    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|integer',
            'product_id' => 'required|integer',
        ]);

        $exists = DB::table('wishlists')->where('user_id', $request->user_id)->where('product_id', $request->product_id)->exists();
        if ($exists) {
            return $this->successResponse([], 'Item already in wishlist');
        }

        $id = DB::table('wishlists')->insertGetId([
            'user_id' => $request->user_id,
            'product_id' => $request->product_id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $this->successResponse(['id' => $id], 'Product added to wishlist successfully', 201);
    }

    public function destroy(Request $request, $id)
    {
        $userId = $request->input('user_id') ?: $request->query('user_id');
        $query = DB::table('wishlists')->where('id', $id);
        if ($userId) {
            $query->where('user_id', $userId);
        }

        $deleted = $query->delete();
        if (!$deleted) {
            return $this->errorResponse('Wishlist item not found', 404);
        }

        return $this->successResponse([], 'Wishlist item removed successfully');
    }

    public function moveToCart(Request $request)
    {
        $request->validate([
            'user_id' => 'required|integer',
            'wishlist_id' => 'required|integer',
            'product_id' => 'required|integer',
            'quantity' => 'nullable|integer|min:1',
            'price' => 'nullable|numeric|min:0',
        ]);

        $wishlistItem = DB::table('wishlists')
            ->where('id', $request->wishlist_id)
            ->where('user_id', $request->user_id)
            ->first();

        if (!$wishlistItem) {
            return $this->errorResponse('Wishlist item not found', 404);
        }

        $product = DB::table('products')
            ->where('id', $request->product_id)
            ->where('is_deleted', 0)
            ->first();

        if (!$product) {
            return $this->errorResponse('Product not found', 404);
        }

        $quantity = (int) ($request->quantity ?: 1);
        if ((int) $product->stock < $quantity) {
            return $this->errorResponse('Not enough stock available', 422);
        }

        return DB::transaction(function () use ($request, $wishlistItem, $product, $quantity) {
            $existing = DB::table('carts')
                ->where('user_id', $request->user_id)
                ->where('product_id', $request->product_id)
                ->first();

            if ($existing) {
                $newQty = (int) $existing->quantity + $quantity;
                if ($newQty > (int) $product->stock) {
                    return $this->errorResponse('Not enough stock available', 422);
                }

                DB::table('carts')
                    ->where('id', $existing->id)
                    ->update([
                        'quantity' => $newQty,
                        'price' => $request->price ?: $existing->price,
                        'size' => $request->input('size', $existing->size),
                        'updated_at' => now(),
                    ]);
            } else {
                DB::table('carts')->insert([
                    'user_id' => $request->user_id,
                    'product_id' => $request->product_id,
                    'quantity' => $quantity,
                    'price' => $request->price ?: $product->price,
                    'size' => $request->input('size', ''),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::table('wishlists')->where('id', $wishlistItem->id)->delete();

            return $this->successResponse([], 'Moved to cart successfully');
        });
    }

    public function status(Request $request)
    {
        $request->validate([
            'user_id' => 'required|integer',
            'product_id' => 'required|integer',
        ]);

        $exists = DB::table('wishlists')->where('user_id', $request->user_id)->where('product_id', $request->product_id)->exists();
        return $this->successResponse(['is_wishlisted' => $exists], 'Wishlist status fetched successfully');
    }

    public function count(Request $request)
    {
        $userId = $request->input('user_id') ?: $request->query('user_id');
        if (!$userId) {
            return $this->successResponse(['count' => 0], 'Wishlist count fetched successfully');
        }

        $count = DB::table('wishlists')->where('user_id', $userId)->count();
        return $this->successResponse(['count' => $count], 'Wishlist count fetched successfully');
    }

    private function successResponse($data, string $message, int $statusCode = 200)
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $statusCode);
    }

    private function errorResponse(string $message, int $statusCode = 422)
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], $statusCode);
    }
}
