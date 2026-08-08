<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CheckoutController extends Controller
{
    public function preview(Request $request)
    {
        $request->validate([
            'user_id' => 'required|integer',
            'items' => 'required|array',
        ]);

        $subtotal = 0;
        $gst = 0;
        foreach ($request->items as $item) {
            $price = (float) ($item['price'] ?? 0);
            $quantity = (int) ($item['quantity'] ?? 1);
            $subtotal += $price * $quantity;
            $gst += ($price * $quantity * (float) ($item['gst_percentage'] ?? 0)) / 100;
        }

        return $this->successResponse([
            'subtotal' => round($subtotal, 2),
            'gst' => round($gst, 2),
            'shipping' => 0,
            'discount' => 0,
            'grand_total' => round($subtotal + $gst, 2),
        ], 'Checkout preview fetched successfully');
    }

    public function placeOrder(Request $request)
    {
        $request->validate([
            'user_id' => 'required|integer',
            'customer_name' => 'required|string',
            'mobile' => 'required|string',
            'email' => 'nullable|email',
            'shipping_address' => 'required|string',
            'billing_address' => 'nullable|string',
            'payment_method' => 'required|string|in:cash,online,upi,credit',
            'items' => 'required|array',
            'company_id' => 'nullable|integer',
            'subtotal' => 'nullable|numeric|min:0',
            'gst' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'grand_total' => 'nullable|numeric|min:0',
            'paid_amount' => 'nullable|numeric|min:0',
            'request_id' => 'nullable|string|max:64',
        ]);

        // Idempotency guard: if this checkout was already processed, return the existing records
        $requestId = $request->input('request_id');
        if ($requestId) {
            $existingOrder = DB::table('orders')->where('request_id', $requestId)->first();
            if ($existingOrder) {
                $existingInvoice = DB::table('invoices')->where('order_id', $existingOrder->id)->first();
                $existingPayment = $existingInvoice
                    ? DB::table('payments')->where('invoice_id', $existingInvoice->id)->first()
                    : null;

                return $this->successResponse([
                    'order_id' => $existingOrder->id,
                    'invoice_id' => $existingInvoice->id ?? null,
                    'invoice_no' => $existingInvoice->invoice_no ?? null,
                    'payment_id' => $existingPayment->id ?? null,
                    'payment_status' => $existingOrder->payment_status ?? 'pending',
                ], 'Order already placed', 200);
            }
        }

        DB::beginTransaction();
        try {
            $stockChecks = [];
            foreach ($request->items as $item) {
                $productId = (int) ($item['product_id'] ?? 0);
                $quantity = (int) ($item['quantity'] ?? 1);
                if ($productId <= 0 || $quantity <= 0) {
                    throw new \Exception('Invalid product quantity');
                }

                $product = DB::table('products')->where('id', $productId)->where('is_deleted', 0)->first();
                if (!$product) {
                    throw new \Exception('One of the products is no longer available');
                }
                if ((int) $product->stock < $quantity) {
                    throw new \Exception('Stock unavailable for one of the products');
                }

                $stockChecks[$productId] = ($stockChecks[$productId] ?? 0) + $quantity;
            }

            foreach ($stockChecks as $productId => $quantity) {
                $updated = DB::table('products')
                    ->where('id', $productId)
                    ->where('is_deleted', 0)
                    ->where('stock', '>=', $quantity)
                    ->decrement('stock', $quantity);

                if (!$updated) {
                    throw new \Exception('Stock unavailable for one of the products');
                }
            }

            $companyId = (int) ($request->company_id ?? 0);
            if ($companyId > 0) {
                $companyExists = DB::table('companies')->where('id', $companyId)->where('is_deleted', 0)->exists();
                if (!$companyExists) {
                    Log::warning("[place_order] invalid company_id={$companyId}, resolving to user's company");
                    $companyId = 0;
                }
            }
            if ($companyId <= 0) {
                $companyId = (int) DB::table('users')->where('id', $request->user_id)->value('company_id');
            }
            if ($companyId <= 0) {
                $fallback = DB::table('companies')->where('is_deleted', 0)->orderBy('id')->first();
                $companyId = $fallback ? (int) $fallback->id : 0;
                if ($companyId > 0) {
                    Log::warning("[place_order] no company on user {$request->user_id}, falling back to company_id={$companyId}");
                }
            }

            $subtotal = (float) ($request->subtotal ?? 0);
            $gst = (float) ($request->gst ?? 0);
            $discount = (float) ($request->discount ?? 0);
            $grandTotal = (float) ($request->grand_total ?? ($subtotal + $gst - $discount));
            $paidAmount = (float) ($request->paid_amount ?? 0);

            if ($request->payment_method === 'credit') {
                $paymentStatus = 'not_paid';
                $paidAmount = 0;
                $balanceAmount = $grandTotal;
            } elseif ($paidAmount >= $grandTotal) {
                $paymentStatus = 'paid';
                $balanceAmount = 0;
            } else {
                $paymentStatus = 'partial';
                $balanceAmount = max(0, $grandTotal - $paidAmount);
            }

            $orderId = DB::table('orders')->insertGetId([
                'user_id' => $request->user_id,
                'company_id' => $companyId,
                'customer_name' => $request->customer_name,
                'mobile' => $request->mobile,
                'email' => $request->email,
                'shipping_address' => $request->shipping_address,
                'billing_address' => $request->billing_address ?: $request->shipping_address,
                'payment_method' => $request->payment_method,
                'payment_status' => $paymentStatus,
                'subtotal' => $subtotal,
                'gst' => $gst,
                'discount' => $discount,
                'grand_total' => $grandTotal,
                'paid_amount' => $paidAmount,
                'status' => $paymentStatus === 'paid' ? 'confirmed' : 'pending',
                'request_id' => $requestId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($request->items as $item) {
                DB::table('order_items')->insert([
                    'order_id' => $orderId,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'] ?? 1,
                    'price' => $item['price'] ?? 0,
                    'size' => $item['size'] ?? '',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::table('carts')->where('user_id', $request->user_id)->delete();

            // Create invoice record (invoice_no assigned from id so the sequence stays continuous)
            $invoiceId = DB::table('invoices')->insertGetId([
                'customer_name' => $request->customer_name,
                'company_id' => $companyId,
                'customer_phone' => $request->mobile,
                'order_id' => $orderId,
                'source' => 'shop_checkout',
                'sub_total' => $subtotal,
                'gst_total' => $gst,
                'total_amount' => $grandTotal,
                'paid_amount' => $paidAmount,
                'balance_amount' => $balanceAmount,
                'payment_method' => $request->payment_method,
                'payment_status' => $paymentStatus,
                'created_at' => now(),
            ]);

            // Shared continuous invoice number (from auto-increment id)
            $invoiceNo = Invoice::numberFor($invoiceId);
            DB::table('invoices')->where('id', $invoiceId)->update(['invoice_no' => $invoiceNo]);

            // Create payment record
            $payment = Payment::create([
                'company_id' => $companyId,
                'invoice_id' => $invoiceId,
                'invoice_no' => $invoiceNo,
                'customer_id' => 0,
                'total_amount' => $grandTotal,
                'paid_amount' => $paidAmount,
                'balance_amount' => $balanceAmount,
                'payment_method' => $request->payment_method,
                'payment_status' => $paymentStatus,
                'notes' => '',
            ]);
            $paymentId = $payment->id;

            DB::commit();

            return $this->successResponse([
                'order_id' => $orderId,
                'invoice_id' => $invoiceId,
                'invoice_no' => $invoiceNo,
                'payment_id' => $paymentId,
                'payment_status' => $paymentStatus,
                'paid_amount' => $paidAmount,
                'balance_amount' => $balanceAmount,
            ], 'Order placed successfully', 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return $this->errorResponse($e->getMessage(), 422);
        }
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
