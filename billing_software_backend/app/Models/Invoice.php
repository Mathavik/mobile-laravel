<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $table = 'invoices';
    protected $guarded = [];
    public $timestamps = false;

    // Helper to decode products JSON
    protected function casts(): array
    {
        return [
            'products' => 'array',
        ];
    }

    // Shared continuous invoice number in the format INV-<YYYYMMDDHHMMSS>-<seq>,
    // where <seq> is derived from the auto-increment id so both the billing/cashier
    // flow and the shop-checkout flow share one continuous sequence.
    public static function numberFor(int $id): string
    {
        return 'INV-' . date('YmdHis') . '-' . $id;
    }
}
