<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CartController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->input('user_id') ?: $request->query('user_id');
        if (!$userId) {
            return $this->errorResponse('User ID is required', 422);
        }

        $items = DB::table('carts as c')
            ->leftJoin('products as p', 'c.product_id', '=', 'p.id')
            ->where('c.user_id', $userId)
            ->select('c.id', 'c.user_id', 'c.product_id', 'c.quantity', 'c.price', 'c.size', 'p.product_name', 'p.image', 'p.video_url', 'p.stock', 'p.gst_percentage')
            ->orderBy('c.created_at', 'desc')
            ->get();

        return $this->successResponse($items, 'Cart fetched successfully');
    }

    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|integer',
            'product_id' => 'required|integer',
            'quantity' => 'nullable|integer|min:1',
            'price' => 'nullable|numeric|min:0',
        ]);

        $product = DB::table('products')->where('id', $request->product_id)->where('is_deleted', 0)->first();
        if (!$product) {
            return $this->errorResponse('Product not found', 404);
        }

        if ((int) $product->stock < (int) ($request->quantity ?: 1)) {
            return $this->errorResponse('Not enough stock available', 422);
        }

        $existing = DB::table('carts')->where('user_id', $request->user_id)->where('product_id', $request->product_id)->first();
        if ($existing) {
            $newQty = (int) $existing->quantity + (int) ($request->quantity ?: 1);
            if ($newQty > (int) $product->stock) {
                return $this->errorResponse('Not enough stock available', 422);
            }
            DB::table('carts')->where('id', $existing->id)->update(['quantity' => $newQty, 'updated_at' => now()]);
            return $this->successResponse(['id' => $existing->id], 'Cart updated successfully');
        }

        $id = DB::table('carts')->insertGetId([
            'user_id' => $request->user_id,
            'product_id' => $request->product_id,
            'quantity' => $request->quantity ?: 1,
            'price' => $request->price ?: $product->price,
            'size' => $request->input('size', ''),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $this->successResponse(['id' => $id], 'Product added to cart successfully', 201);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'user_id' => 'required|integer',
            'quantity' => 'required|integer|min:1',
        ]);

        $item = DB::table('carts')->where('id', $id)->where('user_id', $request->user_id)->first();
        if (!$item) {
            return $this->errorResponse('Cart item not found', 404);
        }

        $product = DB::table('products')->where('id', $item->product_id)->where('is_deleted', 0)->first();
        if (!$product) {
            return $this->errorResponse('Product not found', 404);
        }

        if ((int) $product->stock < (int) $request->quantity) {
            return $this->errorResponse('Not enough stock available', 422);
        }

        DB::table('carts')->where('id', $id)->update(['quantity' => $request->quantity, 'updated_at' => now()]);
        return $this->successResponse([], 'Cart item updated successfully');
    }

    public function destroy(Request $request, $id)
    {
        $userId = $request->input('user_id') ?: $request->query('user_id');
        $query = DB::table('carts')->where('id', $id);
        if ($userId) {
            $query->where('user_id', $userId);
        }
        $deleted = $query->delete();
        if (!$deleted) {
            return $this->errorResponse('Cart item not found', 404);
        }

        return $this->successResponse([], 'Cart item removed successfully');
    }

    public function clear(Request $request)
    {
        $userId = $request->input('user_id') ?: $request->query('user_id');
        if (!$userId) {
            return $this->errorResponse('User ID is required', 422);
        }

        DB::table('carts')->where('user_id', $userId)->delete();
        return $this->successResponse([], 'Cart cleared successfully');
    }

    public function count(Request $request)
    {
        $userId = $request->input('user_id') ?: $request->query('user_id');
        if (!$userId) {
            return $this->successResponse(['count' => 0], 'Cart count fetched successfully');
        }

        $count = DB::table('carts')->where('user_id', $userId)->sum('quantity');
        return $this->successResponse(['count' => $count], 'Cart count fetched successfully');
    }

    public function summary(Request $request)
    {
        $userId = $request->input('user_id') ?: $request->query('user_id');
        if (!$userId) {
            return $this->errorResponse('User ID is required', 422);
        }

        $items = DB::table('carts as c')
            ->leftJoin('products as p', 'c.product_id', '=', 'p.id')
            ->where('c.user_id', $userId)
            ->select('c.*', 'p.product_name', 'p.price as product_price', 'p.gst_percentage', 'p.stock', 'p.image', 'p.video_url')
            ->get();

        $subtotal = 0;
        $gst = 0;
        foreach ($items as $item) {
            $price = (float) ($item->price ?: $item->product_price);
            $subtotal += $price * (int) $item->quantity;
            $gst += ($price * (int) $item->quantity * (float) ($item->gst_percentage ?: 0)) / 100;
        }

        return $this->successResponse([
            'items' => $items,
            'subtotal' => round($subtotal, 2),
            'gst' => round($gst, 2),
            'discount' => 0,
            'grand_total' => round($subtotal + $gst, 2),
        ], 'Cart summary fetched successfully');
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
