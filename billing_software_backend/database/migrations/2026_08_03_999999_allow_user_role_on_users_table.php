<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('users')) {
            return;
        }

        $driver = DB::getDriverName();
        if ($driver === 'sqlite') {
            DB::statement("DROP TABLE IF EXISTS users");
            Schema::create('users', function (Blueprint $table) {
                $table->integer('id', true);
                $table->string('name', 100)->nullable();
                $table->string('email', 100)->unique()->nullable();
                $table->string('password', 255)->nullable();
                $table->enum('role', ['superadmin', 'admin', 'cashier', 'user'])->nullable();
                $table->integer('company_id')->nullable();
                $table->timestamp('created_at')->useCurrent();
                $table->enum('status', ['active', 'inactive'])->default('active');
                $table->integer('admin_id')->nullable();
                $table->string('otp', 10)->nullable();
                $table->timestamp('otp_expiry')->nullable();
            });
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->string('role_new')->nullable()->after('role');
        });

        DB::table('users')->update(['role_new' => DB::raw('role')]);

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['superadmin', 'admin', 'cashier', 'user'])->nullable()->after('password');
        });

        DB::table('users')->update(['role' => DB::raw('role_new')]);

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role_new');
        });
    }

    public function down(): void
    {
        // no-op
    }
};
