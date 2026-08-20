<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('tracking_id')->nullable()->after('request_id');
            $table->string('carrier')->nullable()->after('tracking_id');
            $table->text('tracking_url')->nullable()->after('carrier');
            $table->timestamp('shipped_at')->nullable()->after('tracking_url');
            $table->timestamp('estimated_delivery')->nullable()->after('shipped_at');
            $table->timestamp('delivered_at')->nullable()->after('estimated_delivery');
            $table->text('status_notes')->nullable()->after('delivered_at');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'tracking_id',
                'carrier',
                'tracking_url',
                'shipped_at',
                'estimated_delivery',
                'delivered_at',
                'status_notes',
            ]);
        });
    }
};
