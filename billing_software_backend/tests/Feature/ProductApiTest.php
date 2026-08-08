<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_product_add_persists_shop_fields(): void
    {
        $response = $this->postJson('/api/product/add', [
            'product_name' => 'Silk Saree',
            'product_code' => 'SKU001',
            'category_id' => 1,
            'subcategory_id' => 2,
            'brand_id' => 3,
            'price' => 1299.99,
            'stock' => 25,
            'barcode' => 'ABC123',
            'unit' => 'Piece',
            'gst_percentage' => 18,
            'company_id' => 1,
            'image' => 'https://example.com/image.jpg',
            'image_gallery_json' => [
                'https://example.com/a.jpg',
                'https://example.com/b.jpg',
            ],
            'video_url' => 'https://example.com/video.mp4',
            'short_description' => 'A premium saree',
            'full_description' => 'A detailed description',
            'fabric' => 'Silk',
            'embroidery' => 'Zari',
            'color' => 'Red',
            'available_sizes' => 'S,M,L',
            'occasion' => 'Wedding',
            'active_status' => 'active',
            'view_count' => 7,
            'keywords' => 'saree, silk, wedding',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', true);

        $this->assertDatabaseHas('products', [
            'product_name' => 'Silk Saree',
            'image' => 'https://example.com/image.jpg',
            'video_url' => 'https://example.com/video.mp4',
            'short_description' => 'A premium saree',
            'full_description' => 'A detailed description',
            'fabric' => 'Silk',
            'embroidery' => 'Zari',
            'color' => 'Red',
            'available_sizes' => 'S,M,L',
            'occasion' => 'Wedding',
            'active_status' => 'active',
            'view_count' => 7,
            'keywords' => 'saree, silk, wedding',
        ]);

        $product = \App\Models\Product::where('product_name', 'Silk Saree')->first();
        $this->assertSame('["https://example.com/a.jpg","https://example.com/b.jpg"]', $product->image_gallery_json);
    }
}
