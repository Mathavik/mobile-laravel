<?php

namespace App\Console\Commands;

use App\Mail\DeliveryNotification;
use App\Mail\ShippedNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class AdvanceOrderStatus extends Command
{
    protected $signature = 'orders:advance';
    protected $description = 'Auto-advance order statuses step by step with realistic time gaps';

    public function handle()
    {
        $activeStatuses = ['pending', 'confirmed', 'processing', 'packed', 'shipped'];
        $advanced = 0;

        foreach ($activeStatuses as $fromStatus) {
            $orders = DB::table('orders')
                ->where('status', $fromStatus)
                ->get();

            foreach ($orders as $order) {
                $lastEvent = DB::table('order_status_history')
                    ->where('order_id', $order->id)
                    ->where('status', $fromStatus)
                    ->orderByDesc('happened_at')
                    ->first();

                if (!$lastEvent) continue;

                $happenedAt = \Carbon\Carbon::parse($lastEvent->happened_at);
                $nextStatus = $this->getNextStatus($fromStatus);

                if (!$nextStatus) continue;

                $shouldAdvance = false;
                $note = '';

                switch ($fromStatus) {
                    case 'pending':
                        if ($happenedAt->diffInMinutes(now()) >= 5) {
                            $shouldAdvance = true;
                            $note = 'Payment confirmed automatically';
                        }
                        break;

                    case 'confirmed':
                        if ($happenedAt->diffInMinutes(now()) >= 10) {
                            $shouldAdvance = true;
                            $note = 'Order picked up by warehouse';
                        }
                        break;

                    case 'processing':
                        $nextDay10AM = $happenedAt->copy()->startOfDay()->addDay()->setTime(10, 0, 0);
                        if (now()->gte($nextDay10AM)) {
                            $shouldAdvance = true;
                            $note = 'Items packed and quality checked';
                        }
                        break;

                    case 'packed':
                        $packTime = $happenedAt->copy();
                        $shipTime = $packTime->copy()->setTime(14, 0, 0);
                        if ($packTime->day === now()->day && now()->gte($shipTime)) {
                            $shouldAdvance = true;
                        } elseif (now()->gt($packTime->copy()->addDay()->setTime(14, 0, 0))) {
                            $shouldAdvance = true;
                        }
                        if ($shouldAdvance) {
                            $trackingId = 'OD' . strtoupper(bin2hex(random_bytes(5)));
                            $carrier = $order->carrier ?: 'Delhivery';
                            $note = 'Handed over to ' . $carrier;

                            DB::table('orders')->where('id', $order->id)->update([
                                'tracking_id' => $order->tracking_id ?: $trackingId,
                                'carrier' => $carrier,
                                'tracking_url' => 'https://www.delhivery.com/track/package/' . ($order->tracking_id ?: $trackingId),
                                'shipped_at' => now(),
                            ]);

                            $this->sendShippedEmail($order, $order->tracking_id ?: $trackingId, $carrier);
                        }
                        break;

                    case 'shipped':
                        $estDelivery = $order->estimated_delivery
                            ? \Carbon\Carbon::parse($order->estimated_delivery)
                            : $happenedAt->copy()->addDays(3)->setTime(18, 0, 0);

                        if (now()->gte($estDelivery)) {
                            $shouldAdvance = true;
                            $note = 'Delivered successfully';
                            DB::table('orders')->where('id', $order->id)->update([
                                'delivered_at' => now(),
                            ]);

                            $this->sendDeliveredEmail($order);
                        }
                        break;
                }

                if ($shouldAdvance) {
                    DB::table('orders')->where('id', $order->id)->update([
                        'status' => $nextStatus,
                        'updated_at' => now(),
                    ]);

                    DB::table('order_status_history')->insert([
                        'order_id' => $order->id,
                        'status' => $nextStatus,
                        'note' => $note,
                        'location' => null,
                        'happened_at' => now(),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    $advanced++;
                    $this->info("Order #{$order->id}: {$fromStatus} → {$nextStatus}");
                }
            }
        }

        if ($advanced === 0) {
            $this->info('No orders to advance.');
        } else {
            $this->info("Advanced {$advanced} order(s).");
        }

        return 0;
    }

    private function sendShippedEmail($order, $trackingId, $carrier): void
    {
        if (empty($order->email)) return;

        try {
            $orderArray = (array) $order;
            $orderArray['tracking_id'] = $trackingId;
            $orderArray['carrier'] = $carrier;

            Mail::to($order->email)->send(new ShippedNotification($orderArray));
            $this->info("  → Shipped email sent to {$order->email}");
        } catch (\Exception $e) {
            $this->error("  → Failed to send shipped email: {$e->getMessage()}");
        }
    }

    private function sendDeliveredEmail($order): void
    {
        if (empty($order->email)) return;

        try {
            $items = DB::table('order_items as oi')
                ->leftJoin('products as p', 'oi.product_id', '=', 'p.id')
                ->where('oi.order_id', $order->id)
                ->select('oi.*', 'p.product_name')
                ->get()
                ->map(fn($item) => (array) $item)
                ->toArray();

            Mail::to($order->email)->send(new DeliveryNotification((array) $order, $items));
            $this->info("  → Delivery email sent to {$order->email}");
        } catch (\Exception $e) {
            $this->error("  → Failed to send delivery email: {$e->getMessage()}");
        }
    }

    private function getNextStatus(string $current): ?string
    {
        $flow = [
            'pending'    => 'confirmed',
            'confirmed'  => 'processing',
            'processing' => 'packed',
            'packed'     => 'shipped',
            'shipped'    => 'delivered',
        ];
        return $flow[$current] ?? null;
    }
}
