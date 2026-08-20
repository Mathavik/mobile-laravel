<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderTrackingController extends Controller
{
    public function track(Request $request, $orderId)
    {
        $userId = $request->input('user_id') ?: $request->query('user_id');

        $order = DB::table('orders')->where('id', $orderId);
        if ($userId) {
            $order->where('user_id', $userId);
        }
        $order = $order->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found',
            ], 404);
        }

        $items = DB::table('order_items as oi')
            ->leftJoin('products as p', 'oi.product_id', '=', 'p.id')
            ->where('oi.order_id', $order->id)
            ->select('oi.*', 'p.product_name', 'p.image', 'p.video_url')
            ->get();

        $history = DB::table('order_status_history')
            ->where('order_id', $orderId)
            ->orderBy('happened_at', 'asc')
            ->get();

        $timeline = $this->buildTimeline($order, $history);

        $tracking = [
            'order_id' => $order->id,
            'status' => $order->status ?? 'pending',
            'tracking_id' => $order->tracking_id,
            'carrier' => $order->carrier,
            'tracking_url' => $order->tracking_url,
            'shipped_at' => $order->shipped_at,
            'estimated_delivery' => $order->estimated_delivery,
            'delivered_at' => $order->delivered_at,
            'status_notes' => $order->status_notes,
            'created_at' => $order->created_at,
            'customer_name' => $order->customer_name,
            'shipping_address' => $order->shipping_address,
            'items' => $items,
            'grand_total' => $order->grand_total,
            'timeline' => $timeline,
        ];

        return response()->json([
            'success' => true,
            'message' => 'Order tracking details fetched',
            'data' => $tracking,
        ]);
    }

    private function buildTimeline($order, $history)
    {
        $statuses = [
            'pending' => [
                'label' => 'Order Placed',
                'icon' => 'clipboard-check',
                'description' => 'Your order has been placed successfully',
            ],
            'confirmed' => [
                'label' => 'Order Confirmed',
                'icon' => 'check-circle',
                'description' => 'Your order has been confirmed',
            ],
            'processing' => [
                'label' => 'Processing',
                'icon' => 'loader',
                'description' => 'Your order is being processed',
            ],
            'packed' => [
                'label' => 'Packed',
                'icon' => 'package',
                'description' => 'Your order has been packed and ready for dispatch',
            ],
            'shipped' => [
                'label' => 'Shipped',
                'icon' => 'truck',
                'description' => 'Your order is on the way',
            ],
            'delivered' => [
                'label' => 'Delivered',
                'icon' => 'map-pin-check',
                'description' => 'Your order has been delivered',
            ],
        ];

        $cancelledStatus = [
            'cancelled' => [
                'label' => 'Cancelled',
                'icon' => 'x-circle',
                'description' => 'Your order has been cancelled',
            ],
        ];

        $statusOrder = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered'];
        $currentStatus = $order->status ?? 'pending';

        if ($currentStatus === 'cancelled') {
            return [
                [
                    'status' => 'cancelled',
                    'label' => $cancelledStatus['cancelled']['label'],
                    'icon' => $cancelledStatus['cancelled']['icon'],
                    'description' => $cancelledStatus['cancelled']['description'],
                    'completed' => true,
                    'active' => true,
                    'happened_at' => $order->updated_at,
                    'note' => $order->status_notes,
                ],
            ];
        }

        $currentIndex = array_search($currentStatus, $statusOrder);
        if ($currentIndex === false) {
            $currentIndex = 0;
        }

        $historyMap = [];
        foreach ($history as $h) {
            $historyMap[$h->status] = $h;
        }

        $timeline = [];
        foreach ($statusOrder as $index => $status) {
            $info = $statuses[$status];
            $completed = $index < $currentIndex;
            $active = $index === $currentIndex;
            $happenedAt = null;
            $note = null;

            if (isset($historyMap[$status])) {
                $happenedAt = $historyMap[$status]->happened_at;
                $note = $historyMap[$status]->note;
            } elseif ($completed || $active) {
                if ($status === 'pending') {
                    $happenedAt = $order->created_at;
                } elseif ($status === 'shipped') {
                    $happenedAt = $order->shipped_at;
                } elseif ($status === 'delivered') {
                    $happenedAt = $order->delivered_at;
                } elseif ($active) {
                    $happenedAt = $order->updated_at;
                }
            }

            $timeline[] = [
                'status' => $status,
                'label' => $info['label'],
                'icon' => $info['icon'],
                'description' => $info['description'],
                'completed' => $completed,
                'active' => $active,
                'happened_at' => $happenedAt,
                'note' => $note,
            ];
        }

        return $timeline;
    }

    public function updateStatus(Request $request, $orderId)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,confirmed,processing,packed,shipped,delivered,cancelled',
            'note' => 'nullable|string|max:500',
            'location' => 'nullable|string|max:255',
            'tracking_id' => 'nullable|string|max:64',
            'carrier' => 'nullable|string|max:100',
            'tracking_url' => 'nullable|string|max:500',
            'estimated_delivery' => 'nullable|date',
        ]);

        $order = DB::table('orders')->where('id', $orderId)->first();
        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found',
            ], 404);
        }

        $updateData = [
            'status' => $validated['status'],
            'status_notes' => $validated['note'] ?? $order->status_notes,
            'updated_at' => now(),
        ];

        if ($validated['status'] === 'shipped') {
            $updateData['shipped_at'] = now();
            if (!empty($validated['tracking_id'])) {
                $updateData['tracking_id'] = $validated['tracking_id'];
            }
            if (!empty($validated['carrier'])) {
                $updateData['carrier'] = $validated['carrier'];
            }
            if (!empty($validated['tracking_url'])) {
                $updateData['tracking_url'] = $validated['tracking_url'];
            }
            if (!empty($validated['estimated_delivery'])) {
                $updateData['estimated_delivery'] = $validated['estimated_delivery'];
            }
        }

        if ($validated['status'] === 'delivered') {
            $updateData['delivered_at'] = now();
        }

        DB::table('orders')->where('id', $orderId)->update($updateData);

        DB::table('order_status_history')->insert([
            'order_id' => $orderId,
            'status' => $validated['status'],
            'note' => $validated['note'] ?? null,
            'location' => $validated['location'] ?? null,
            'happened_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return response()->json([
            'success' => true,
            'message' => 'Order status updated successfully',
        ]);
    }
}
