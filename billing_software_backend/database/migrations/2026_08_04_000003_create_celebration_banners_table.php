<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Banners for the "CRAFTED FOR CELEBRATION" storefront section.
     *
     * Stores only the remote image URL (no file upload). Only `is_active`
     * banners, sorted by `display_order` (ascending), are shown on the
     * storefront. The first active banner is displayed.
     */
    public function up(): void
    {
        if (!Schema::hasTable('celebration_banners')) {
            Schema::create('celebration_banners', function (Blueprint $table) {
                $table->id();
                $table->string('banner_name')->nullable();
                $table->string('image_url')->nullable();
                $table->integer('display_order')->default(0);
                $table->tinyInteger('is_active')->default(1);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('celebration_banners');
    }
};
