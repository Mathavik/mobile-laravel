<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Performance indexes for the customer storefront.
 *
 * Product listing / search / filter queries repeatedly filter on
 * company_id, category_id, price, is_deleted, active_status and sort by
 * created_at. Adding these indexes keeps page loads fast as the product
 * table grows. Each index is added with a guard so re-running the
 * migration never fails on an existing index.
 */
return new class extends Migration
{
    private function addIndexIfMissing(string $table, string $index, string|array $columns): void
    {
        if (Schema::hasTable($table) && !Schema::hasIndex($table, $index)) {
            Schema::table($table, function (Blueprint $table) use ($index, $columns) {
                $table->index($columns, $index);
            });
        }
    }

    public function up(): void
    {
        $this->addIndexIfMissing('products', 'idx_products_listing', ['is_deleted', 'active_status', 'created_at']);
        $this->addIndexIfMissing('products', 'idx_products_company', 'company_id');
        $this->addIndexIfMissing('products', 'idx_products_category', 'category_id');
        $this->addIndexIfMissing('products', 'idx_products_subcategory', 'subcategory_id');
        $this->addIndexIfMissing('products', 'idx_products_brand', 'brand_id');
        $this->addIndexIfMissing('products', 'idx_products_price', 'price');
        $this->addIndexIfMissing('products', 'idx_products_product_name', 'product_name');

        $this->addIndexIfMissing('product_keywords', 'idx_product_keywords_keyword', 'keyword');

        $this->addIndexIfMissing('categories', 'idx_categories_storefront', ['company_id', 'status', 'is_deleted']);
        $this->addIndexIfMissing('categories', 'idx_categories_spotlight', 'spotlight_active');

        $this->addIndexIfMissing('home_page_banners', 'idx_home_banners_active', ['company_id', 'is_active', 'display_order']);
        $this->addIndexIfMissing('celebration_banners', 'idx_celebration_banners_active', ['is_active', 'display_order']);
    }

    public function down(): void
    {
        $drop = function (string $table, array $indexes) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $table) use ($indexes) {
                    foreach ($indexes as $index) {
                        if (Schema::hasIndex($table, $index)) {
                            $table->dropIndex($index);
                        }
                    }
                });
            }
        };

        $drop('products', [
            'idx_products_listing',
            'idx_products_company',
            'idx_products_category',
            'idx_products_subcategory',
            'idx_products_brand',
            'idx_products_price',
            'idx_products_product_name',
        ]);
        $drop('product_keywords', ['idx_product_keywords_keyword']);
        $drop('categories', ['idx_categories_storefront', 'idx_categories_spotlight']);
        $drop('home_page_banners', ['idx_home_banners_active']);
        $drop('celebration_banners', ['idx_celebration_banners_active']);
    }
};
