<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Product extends Model
{
    protected $table = 'products';
    protected $guarded = [];
    public $timestamps = true;

    // One product may have many keywords (relational product_keywords table).
    public function keywords()
    {
        return $this->hasMany(ProductKeyword::class, 'product_id');
    }

    // Get the normalized keyword list for this product as an array of strings.
    public function keywordList(): array
    {
        return $this->keywords()->orderBy('id')->pluck('keyword')->toArray();
    }

    // Normalize arbitrary keyword input (array or comma-separated string)
    // into a unique, trimmed, lowercased array.
    public static function normalizeKeywords($input): array
    {
        if (is_array($input)) {
            $items = $input;
        } else {
            $items = preg_split('/[,]+/', (string) $input) ?: [];
        }

        $result = [];
        foreach ($items as $item) {
            $item = mb_strtolower(trim((string) $item));
            $item = preg_replace('/\s+/', ' ', $item) ?? $item;
            if ($item !== '' && !in_array($item, $result, true)) {
                $result[] = $item;
            }
        }

        return $result;
    }

    // Store the keyword list for a product: replaces any existing rows.
    public static function syncKeywords($productId, $keywords): array
    {
        $list = self::normalizeKeywords($keywords);

        DB::table('product_keywords')->where('product_id', $productId)->delete();

        foreach ($list as $keyword) {
            DB::table('product_keywords')->insert([
                'product_id' => $productId,
                'keyword' => $keyword,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return $list;
    }

    // Accessor for IMAGE URL
    public function getImageUrlAttribute()
    {
        if ($this->image) {
            if (filter_var($this->image, FILTER_VALIDATE_URL)) {
                return $this->image;
            }
            // Strip a leading "storage/" prefix to avoid double-prefixing
            $path = preg_replace('#^storage/#', '', $this->image);
            return asset('storage/' . $path);
        }
        return null;
    }

    public function getImageSrcAttribute()
    {
        return $this->image_url;
    }

    // Accessor for VIDEO URL. Aligns with the image logic so relative storage
    // paths are resolved to a fully qualified URL, while full URLs are kept.
    public function getVideoUrlAttribute($value = null)
    {
        $source = $value ?? $this->getRawOriginal('video_url');

        if (!$source) {
            return null;
        }

        if (filter_var($source, FILTER_VALIDATE_URL) || strpos($source, 'data:') === 0) {
            return $source;
        }

        $path = preg_replace('#^storage/#', '', $source);
        return asset('storage/' . $path);
    }
}
