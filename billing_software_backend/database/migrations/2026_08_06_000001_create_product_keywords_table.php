<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Relational keywords table.
     *
     * Each row holds one normalized (lowercased, trimmed) keyword belonging to
     * exactly one product. Multiple keywords may exist per product.
     * A named index "fk_product_keywords_product" speeds up lookups on
     * product_id, and an index on "keyword" makes searching very fast.
     */
    public function up(): void
    {
        if (!Schema::hasTable('product_keywords')) {
            Schema::create('product_keywords', function (Blueprint $table) {
                $table->id();
                $table->integer('product_id');
                $table->string('keyword', 190);

                // Named foreign key + index (matches existing style)
                $table->index('product_id', 'fk_product_keywords_product');
                $table->foreign('product_id', 'fk_product_keywords_product')
                    ->references('id')->on('products')
                    ->onDelete('cascade');

                // Fast keyword search
                $table->index('keyword', 'idx_product_keywords_keyword');

                $table->timestamp('created_at')->useCurrent();
                $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('product_keywords');
    }
};