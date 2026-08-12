<?php

namespace App\Domain\Production\Actions;

use App\Domain\Production\Models\QCSample;

class RecordUjiTekanResultAction
{
    public function execute(QCSample $sample, $hasil, $catatan = null): QCSample
    {
        $sample->update([
            'hasil_uji_tekan' => $hasil,
            'status' => $hasil >= 0 ? 'lolos' : 'tidak_lolos',
            'catatan' => $catatan ?? $sample->catatan,
        ]);
        return $sample;
    }
}
