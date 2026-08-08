cd<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Store a banner image URL instead of an uploaded file.
 *
 * Renames `banner_image` (uploaded file path) to `image_url`
 * (a remote/full image URL stored directly as a string).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('home_page_banners', 'banner_image')
            && !Schema::hasColumn('home_page_banners', 'image_url')) {
            Schema::table('home_page_banners', function (Blueprint $table) {
                $table->renameColumn('banner_image', 'image_url');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('home_page_banners', 'image_url')
            && !Schema::hasColumn('home_page_banners', 'banner_image')) {
            Schema::table('home_page_banners', function (Blueprint $table) {
                $table->renameColumn('image_url', 'banner_image');
            });
        }
    }
};