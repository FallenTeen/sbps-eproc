<?php

namespace App\Domain\Production\Actions;

use App\Domain\Production\Models\QCSample;

class RecordUjiTekanResultAction
{
    public function execute(QCSample $sample, $hasil, $catatan = null, $targetMpa = null): QCSample
    {
        $target = $targetMpa === null ? 0 : (float) $targetMpa;
        $status = (float) $hasil >= $target && (float) $hasil > 0 ? 'lolos' : 'tidak_lolos';

        $sample->update([
            'hasil_uji_tekan' => (float) $hasil,
            'status' => $status,
            'catatan' => $catatan ?? $sample->catatan,
        ]);

        return $sample;
    }
}