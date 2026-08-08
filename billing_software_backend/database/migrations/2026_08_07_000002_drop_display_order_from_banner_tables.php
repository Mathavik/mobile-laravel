<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Removes the display_order column from the banner tables (ordering is no
     * longer managed manually). Dropping the column also removes it from any
     * composite indexes that reference it. Columns are dropped only if present
     * so the migration is safe on any DB.
     */
    public function up(): void
    {
        foreach (['home_page_banners', 'celebration_banners'] as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'display_order')) {
                Schema::table($table, function (Blueprint $blueprint) {
                    $blueprint->dropColumn('display_order');
                });
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('home_page_banners') && !Schema::hasColumn('home_page_banners', 'display_order')) {
            Schema::table('home_page_banners', function (Blueprint $table) {
                $table->integer('display_order')->default(0);
            });
        }
        if (Schema::hasTable('celebration_banners') && !Schema::hasColumn('celebration_banners', 'display_order')) {
            Schema::table('celebration_banners', function (Blueprint $table) {
                $table->integer('display_order')->default(0);
            });
        }
    }
};
