<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (!Schema::hasColumn('orders', 'request_id')) {
                    $table->string('request_id', 64)->nullable()->after('paid_amount');
                }
                $table->index('request_id', 'idx_orders_request_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (Schema::hasColumn('orders', 'request_id')) {
                    $table->dropColumn('request_id');
                }
            });
        }
    }
};
