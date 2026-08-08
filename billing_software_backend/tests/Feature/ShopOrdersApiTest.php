<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShopOrdersApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_shop_orders_endpoint_returns_items_with_product_details(): void
    {
        $userId = 1;

        $product = \App\Models\Product::create([
            'product_name' => 'Test Product',
            'price' => 100,
            'stock' => 10,
            'is_deleted' => 0,
            'company_id' => 1,
        ]);

        $orderId = \Illuminate\Support\Facades\DB::table('orders')->insertGetId([
            'user_id' => $userId,
            'customer_name' => 'Test Customer',
            'mobile' => '1234567890',
            'shipping_address' => 'Address',
            'payment_method' => 'cod',
            'subtotal' => 100,
            'gst' => 0,
            'discount' => 0,
            'grand_total' => 100,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        \Illuminate\Support\Facades\DB::table('order_items')->insert([
            'order_id' => $orderId,
            'product_id' => $product->id,
            'quantity' => 2,
            'price' => 100,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->getJson('/api/shop/orders?user_id=' . $userId);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data');

        $this->assertSame('Test Product', $response->json('data.0.items.0.product_name'));
    }

    public function test_shop_invoice_endpoint_returns_invoice_payload(): void
    {
        $userId = 2;
        $product = \App\Models\Product::create([
            'product_name' => 'Invoice Product',
            'price' => 150,
            'stock' => 5,
            'is_deleted' => 0,
            'company_id' => 1,
        ]);

        $orderId = \Illuminate\Support\Facades\DB::table('orders')->insertGetId([
            'user_id' => $userId,
            'customer_name' => 'Invoice Customer',
            'mobile' => '9876543210',
            'email' => 'invoice@example.com',
            'shipping_address' => 'Invoice Address',
            'payment_method' => 'cod',
            'payment_status' => 'pending',
            'subtotal' => 150,
            'gst' => 0,
            'discount' => 0,
            'grand_total' => 150,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        \Illuminate\Support\Facades\DB::table('order_items')->insert([
            'order_id' => $orderId,
            'product_id' => $product->id,
            'quantity' => 1,
            'price' => 150,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->getJson('/api/shop/orders/' . $orderId . '/invoice?user_id=' . $userId);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.customer_name', 'Invoice Customer');
    }
}
