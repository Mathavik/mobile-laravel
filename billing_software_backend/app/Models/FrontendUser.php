<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FrontendUser extends Model
{
    protected $table = 'frontend_users';
    protected $guarded = [];
    public $timestamps = true;
}
