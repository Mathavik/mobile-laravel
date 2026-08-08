<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'image')) {
                $table->string('image')->nullable()->after('updated_at');
            }
            if (!Schema::hasColumn('products', 'image_gallery_json')) {
                $table->text('image_gallery_json')->nullable()->after('image');
            }
            if (!Schema::hasColumn('products', 'video_url')) {
                $table->string('video_url')->nullable()->after('image_gallery_json');
            }
            if (!Schema::hasColumn('products', 'short_description')) {
                $table->text('short_description')->nullable()->after('video_url');
            }
            if (!Schema::hasColumn('products', 'full_description')) {
                $table->longText('full_description')->nullable()->after('short_description');
            }
            if (!Schema::hasColumn('products', 'fabric')) {
                $table->string('fabric')->nullable()->after('full_description');
            }
            if (!Schema::hasColumn('products', 'embroidery')) {
                $table->string('embroidery')->nullable()->after('fabric');
            }
            if (!Schema::hasColumn('products', 'color')) {
                $table->string('color')->nullable()->after('embroidery');
            }
            if (!Schema::hasColumn('products', 'available_sizes')) {
                $table->string('available_sizes')->nullable()->after('color');
            }
            if (!Schema::hasColumn('products', 'occasion')) {
                $table->string('occasion')->nullable()->after('available_sizes');
            }
            if (!Schema::hasColumn('products', 'active_status')) {
                $table->string('active_status')->default('active')->after('occasion');
            }
            if (!Schema::hasColumn('products', 'view_count')) {
                $table->unsignedInteger('view_count')->default(0)->after('active_status');
            }
            if (!Schema::hasColumn('products', 'keywords')) {
                $table->string('keywords')->nullable()->after('view_count');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $columns = ['image', 'image_gallery_json', 'video_url', 'short_description', 'full_description', 'fabric', 'embroidery', 'color', 'available_sizes', 'occasion', 'active_status', 'view_count', 'keywords'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('products', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
