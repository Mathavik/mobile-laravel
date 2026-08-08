<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Links each invoice to its shop order (order_id) and records where the
     * invoice was created from (source: 'billing' or 'shop_checkout').
     * Both columns are added only if missing so the migration is safe on any DB.
     */
    public function up(): void
    {
        if (Schema::hasTable('invoices')) {
            if (!Schema::hasColumn('invoices', 'order_id')) {
                Schema::table('invoices', function (Blueprint $table) {
                    $table->unsignedBigInteger('order_id')->nullable()->after('id');
                });
            }
            if (!Schema::hasColumn('invoices', 'source')) {
                Schema::table('invoices', function (Blueprint $table) {
                    $table->string('source', 20)->nullable()->default('billing');
                });
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('invoices')) {
            Schema::table('invoices', function (Blueprint $table) {
                if (Schema::hasColumn('invoices', 'order_id')) {
                    $table->dropColumn('order_id');
                }
                if (Schema::hasColumn('invoices', 'source')) {
                    $table->dropColumn('source');
                }
            });
        }
    }
};
