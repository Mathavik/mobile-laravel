<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add `spotlight_active` flag to categories.
     *
     * 0 (default) = category is NOT shown in the "IN THE SPOTLIGHT" section
     * 1           = category is featured in the spotlight section
     *
     * Only ONE category should be active at a time (enforced in the controller).
     */
    public function up(): void
    {
        if (!Schema::hasColumn('categories', 'spotlight_active')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->tinyInteger('spotlight_active')->default(0);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('categories', 'spotlight_active')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->dropColumn('spotlight_active');
            });
        }
    }
};
