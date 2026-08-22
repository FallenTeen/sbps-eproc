<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Domain\Shared\Models\Dokumen;
use App\Http\Controllers\Api\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;

class UploadController extends Controller
{
    use ApiResponse;

    /**
     * POST /api/mobile/upload
     * Multipart: files[] (multiple), file_type (foto|pdf|dokumen), ...
     * Idempotent via client_uuid: retry dengan uuid sama tidak membuat dokumen dobel.
     */
    public function upload(Request $request)
    {
        $maxFiles = (int) config('mobile.upload.max_files', 10);
        $maxSizeKb = (int) config('mobile.upload.max_size_mb', 10) * 1024;

        $validated = $request->validate([
            'client_uuid' => 'required|uuid',
            'files' => "required|array|min:1|max:{$maxFiles}",
            'files.*' => "file|max:{$maxSizeKb}",
            'file_type' => 'required|in:foto,pdf,dokumen',
            'subject_type' => 'nullable|string|max:255',
            'subject_id' => 'nullable|string|max:255',
            'kategori' => 'nullable|string|max:255',
            'catatan' => 'nullable|string|max:2000',
        ]);

        // Kiriman ulang dengan client_uuid sama → balas hasil upload sebelumnya.
        $existing = Dokumen::where('client_uuid', $validated['client_uuid'])
            ->orderBy('created_at')
            ->get();

        if ($existing->isNotEmpty()) {
            return $this->success(
                $existing->map(fn (Dokumen $d) => $this->dokumenPayload($d, $validated['file_type']))->all(),
                'File sudah diupload sebelumnya.'
            );
        }

        $fileType = $validated['file_type'];
        $files = [];
        // Unik komposit (client_uuid, nama): dua file bernama sama dalam satu
        // kiriman diberi sufiks agar keduanya tetap tersimpan.
        $namaCount = [];

        try {
            foreach ($request->file('files') as $file) {
                // Baca metadata SEBELUM addMedia() (medialibrary menghapus file asli).
                $nama = $file->getClientOriginalName();

                if (array_key_exists($nama, $namaCount)) {
                    $namaCount[$nama]++;
                    $nama = pathinfo($nama, PATHINFO_FILENAME)."-{$namaCount[$nama]}.".pathinfo($nama, PATHINFO_EXTENSION);
                } else {
                    $namaCount[$nama] = 0;
                }

                $mime = $file->getMimeType();
                $size = $file->getSize();

                try {
                    $dokumen = Dokumen::create([
                        'subject_type' => $validated['subject_type'] ?? null,
                        'subject_id' => $validated['subject_id'] ?? null,
                        'nama' => $nama,
                        'kategori' => $validated['kategori'] ?? $fileType,
                        'tipe' => $mime,
                        'catatan' => $validated['catatan'] ?? null,
                        'uploaded_by' => $request->user()->id,
                        'client_uuid' => $validated['client_uuid'],
                    ]);
                } catch (UniqueConstraintViolationException) {
                    // Request paralel dengan client_uuid sama menembak bersamaan.
                    return $this->success(
                        Dokumen::where('client_uuid', $validated['client_uuid'])
                            ->orderBy('created_at')
                            ->get()
                            ->map(fn (Dokumen $d) => $this->dokumenPayload($d, $fileType))
                            ->all(),
                        'File sudah diupload sebelumnya.'
                    );
                }

                $dokumen->addMedia($file)
                    ->toMediaCollection('file', config('mobile.upload.disk', 'public'));

                $files[] = [
                    'id' => $dokumen->id,
                    'nama' => $nama,
                    'file_type' => $fileType,
                    'mime' => $mime,
                    'size' => $size,
                    'url' => $dokumen->getFirstMediaUrl('file'),
                ];
            }
        } catch (\Throwable $e) {
            // Gagal di tengah batch: buang baris dokumen yang sudah terlanjur dibuat
            // agar retry dengan client_uuid sama bisa diproses utuh dari awal.
            Dokumen::where('client_uuid', $validated['client_uuid'])->get()
                ->each(fn (Dokumen $d) => $d->delete());

            throw $e;
        }

        return $this->success($files, 'File berhasil diupload.', 201);
    }

    private function dokumenPayload(Dokumen $dokumen, string $fileType): array
    {
        $media = $dokumen->getFirstMedia('file');

        return [
            'id' => $dokumen->id,
            'nama' => $dokumen->nama,
            'file_type' => $fileType,
            'mime' => $media?->mime_type ?? $dokumen->tipe,
            'size' => $media?->size,
            'url' => $dokumen->getFirstMediaUrl('file'),
        ];
    }

    /**
     * DELETE /api/mobile/upload/{id}
     */
    public function destroy(Request $request, string $id)
    {
        $dokumen = Dokumen::findOrFail($id);

        if ($dokumen->uploaded_by !== $request->user()->id && ! $request->user()->isOwner()) {
            return $this->error('Anda tidak berhak menghapus file ini.', 403);
        }

        $dokumen->clearMediaCollection('file');
        $dokumen->delete();

        return $this->success(null, 'File berhasil dihapus.');
    }
}
