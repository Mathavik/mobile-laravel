<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Remove the deprecated `show_on_homepage` flag. The "IN THE SPOTLIGHT"
     * section is now driven solely by `spotlight_active`.
     */
    public function up(): void
    {
        if (Schema::hasColumn('categories', 'show_on_homepage')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->dropColumn('show_on_homepage');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasColumn('categories', 'show_on_homepage')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->tinyInteger('show_on_homepage')->default(0);
            });
        }
    }
};
