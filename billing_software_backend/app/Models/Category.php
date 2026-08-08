<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $table = 'categories';
    protected $guarded = [];
    public $timestamps = true;

    // Accessor for IMAGE URL
    public function getImageUrlAttribute()
    {
        if ($this->image) {
            if (filter_var($this->image, FILTER_VALIDATE_URL)) {
                return $this->image;
            }
            return asset('storage/' . $this->image);
        }
        return null;
    }

    // Accessor for VIDEO URL
    public function getVideoUrlAttribute()
    {
        if ($this->video) {
            if (filter_var($this->video, FILTER_VALIDATE_URL)) {
                return $this->video;
            }
            return asset('storage/' . $this->video);
        }
        return null;
    }

    public function getImageSrcAttribute()
    {
        return $this->image_url;
    }

    public function getVideoSrcAttribute()
    {
        return $this->video_url;
    }
}