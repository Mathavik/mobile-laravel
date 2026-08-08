<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Homepage banners for the "EDITOR'S PICK" storefront section.
     *
     * Each banner links to a collection (category). Only `is_active` banners,
     * sorted by `display_order` (ascending), are shown on the storefront.
     */
    public function up(): void
    {
        if (!Schema::hasTable('home_page_banners')) {
            Schema::create('home_page_banners', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('company_id')->nullable()->index();
                $table->string('banner_name')->nullable();
                $table->string('banner_image')->nullable();
                $table->unsignedBigInteger('collection_id')->nullable();
                $table->integer('display_order')->default(0);
                $table->tinyInteger('is_active')->default(1);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('home_page_banners');
    }
};