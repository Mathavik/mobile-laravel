<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductKeyword extends Model
{
    protected $table = 'product_keywords';
    protected $guarded = [];
    public $timestamps = true;

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
