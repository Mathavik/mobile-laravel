<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $columns = [
                'mrp' => 'decimal', // Original / MRP price (strike-through in store)
                'model_name' => 'string', // e.g. "Galaxy A54"
                'ram' => 'string', // e.g. "8 GB"
                'internal_storage' => 'string', // e.g. "256 GB"
                'display_size' => 'string', // e.g. "6.4 inch"
                'display_type' => 'string', // e.g. "AMOLED"
                'processor' => 'string', // e.g. "Snapdragon 695"
                'battery_capacity' => 'string', // e.g. "5000 mAh"
                'rear_camera' => 'string', // e.g. "50 MP + 8 MP"
                'front_camera' => 'string', // e.g. "16 MP"
                'operating_system' => 'string', // e.g. "Android 14"
                'network_type' => 'string', // e.g. "5G, 4G VoLTE"
                'sim_slots' => 'string', // e.g. "Dual SIM"
                'warranty' => 'string', // e.g. "1 Year Brand Warranty"
                'condition' => 'string', // e.g. "New" / "Refurbished"
            ];

            foreach ($columns as $column => $type) {
                if (!Schema::hasColumn('products', $column)) {
                    if ($type === 'decimal') {
                        $table->decimal($column, 10, 2)->nullable()->after('price');
                    } else {
                        $table->string($column)->nullable()->after('occasion');
                    }
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $columns = ['mrp', 'model_name', 'ram', 'internal_storage', 'display_size', 'display_type', 'processor', 'battery_capacity', 'rear_camera', 'front_camera', 'operating_system', 'network_type', 'sim_slots', 'warranty', 'condition'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('products', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
