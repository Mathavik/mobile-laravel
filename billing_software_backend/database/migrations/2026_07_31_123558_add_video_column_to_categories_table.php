<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if table exists
        if (Schema::hasTable('categories')) {
            Schema::table('categories', function (Blueprint $table) {
                // Check if column doesn't exist
                if (!Schema::hasColumn('categories', 'video')) {
                    $table->string('video')->nullable()->after('image');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            if (Schema::hasColumn('categories', 'video')) {
                $table->dropColumn('video');
            }
        });
    }
};