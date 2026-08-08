<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->input('user_id') ?: $request->query('user_id');
        if (!$userId) {
            return $this->errorResponse('User ID is required', 422);
        }

        $orders = DB::table('orders')->where('user_id', $userId)->orderBy('created_at', 'desc')->get();

        foreach ($orders as $order) {
            $items = DB::table('order_items as oi')
                ->leftJoin('products as p', 'oi.product_id', '=', 'p.id')
                ->where('oi.order_id', $order->id)
                ->select('oi.*', 'p.product_name', 'p.image', 'p.video_url', 'p.price as product_price')
                ->get();

            $order->items = $items;
            $order->total = $order->grand_total ?? 0;
            $order->payment_status = $order->payment_status ?? 'pending';
        }

        return $this->successResponse($orders, 'Orders fetched successfully');
    }

    public function show(Request $request, $id)
    {
        $userId = $request->input('user_id') ?: $request->query('user_id');
        $order = DB::table('orders')->where('id', $id);
        if ($userId) {
            $order->where('user_id', $userId);
        }
        $order = $order->first();

        if (!$order) {
            return $this->errorResponse('Order not found', 404);
        }

        $items = DB::table('order_items as oi')
            ->leftJoin('products as p', 'oi.product_id', '=', 'p.id')
            ->where('oi.order_id', $order->id)
            ->select('oi.*', 'p.product_name', 'p.image', 'p.video_url', 'p.price as product_price')
            ->get();

        $order->items = $items;
        $order->total = $order->grand_total ?? 0;
        $order->payment_status = $order->payment_status ?? 'pending';

        return $this->successResponse($order, 'Order fetched successfully');
    }

    public function invoice(Request $request, $id)
    {
        $userId = $request->input('user_id') ?: $request->query('user_id');
        $order = DB::table('orders')->where('id', $id);
        if ($userId) {
            $order->where('user_id', $userId);
        }
        $order = $order->first();

        if (!$order) {
            return $this->errorResponse('Order not found', 404);
        }

        $items = DB::table('order_items as oi')
            ->leftJoin('products as p', 'oi.product_id', '=', 'p.id')
            ->where('oi.order_id', $order->id)
            ->select('oi.*', 'p.product_name', 'p.image', 'p.video_url', 'p.gst_percentage')
            ->get();

        // Calculate totals from items
        $sub_total = 0;
        $gst_total = 0;
        
        foreach ($items as $item) {
            $sub_total += ($item->quantity ?? $item->qty ?? 0) * ($item->price ?? 0);
            $gst_total += ($item->quantity ?? $item->qty ?? 0) * ($item->price ?? 0) * (($item->gst_percentage ?? 0) / 100);
        }

        $total_amount = $sub_total + $gst_total - ($order->discount ?? 0);
        $paid_amount = $order->paid_amount ?? 0;
        $balance_amount = $total_amount - $paid_amount;

        $invoice = [
            'id' => $order->id,
            'invoice_no' => 'SHOP-' . str_pad((string) $order->id, 6, '0', STR_PAD_LEFT),
            'customer_name' => $order->customer_name,
            'customer_phone' => $order->mobile,
            'email' => $order->email,
            'shipping_address' => $order->shipping_address,
            'payment_method' => $order->payment_method ?? 'N/A',
            'payment_status' => $order->payment_status ?? 'pending',
            'created_at' => $order->created_at,
            'company_name' => 'Bridal Boutique',
            'company_address' => '123 Bridal Street, Chennai',
            'company_phone' => '+91 98765 43210',
            'company_email' => 'info@bridalboutique.com',
            'company_gstin' => '22AAAAA0000A1Z5',
            'items' => $items,
            'sub_total' => $sub_total,
            'gst_total' => $gst_total,
            'discount' => $order->discount ?? 0,
            'total_amount' => $total_amount,
            'paid_amount' => $paid_amount,
            'balance_amount' => max(0, $balance_amount),
        ];

        return $this->successResponse($invoice, 'Invoice fetched successfully');
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
