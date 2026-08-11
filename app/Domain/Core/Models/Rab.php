<?php
namespace App\Domain\Core\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Rab extends Model {
    use HasUuids;
    protected $table = 'rab';
    protected $fillable = ['proyek_id', 'titik_id', 'kategori', 'rencana', 'catatan', 'created_by'];

    public function proyek() {
        return $this->belongsTo(Proyek::class);
    }

    public function titik() {
        return $this->belongsTo(Titik::class);
    }
}
