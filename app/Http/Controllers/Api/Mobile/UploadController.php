<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Domain\Shared\Models\Dokumen;
use App\Http\Controllers\Api\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class UploadController extends Controller
{
    use ApiResponse;

    /**
     * POST /api/mobile/upload
     * Multipart: files[] (multiple), file_type (foto|pdf|dokumen), ...
     */
    public function upload(Request $request)
    {
        $maxFiles = (int) config('mobile.upload.max_files', 10);
        $maxSizeKb = (int) config('mobile.upload.max_size_mb', 10) * 1024;

        $validated = $request->validate([
            'files' => "required|array|min:1|max:{$maxFiles}",
            'files.*' => "file|max:{$maxSizeKb}",
            'file_type' => 'required|in:foto,pdf,dokumen',
            'subject_type' => 'nullable|string|max:255',
            'subject_id' => 'nullable|string|max:255',
            'kategori' => 'nullable|string|max:255',
            'catatan' => 'nullable|string|max:2000',
        ]);

        $fileType = $validated['file_type'];
        $files = [];

        foreach ($request->file('files') as $file) {
            // Baca metadata SEBELUM addMedia() (medialibrary menghapus file asli).
            $nama = $file->getClientOriginalName();
            $mime = $file->getMimeType();
            $size = $file->getSize();

            $dokumen = Dokumen::create([
                'subject_type' => $validated['subject_type'] ?? null,
                'subject_id' => $validated['subject_id'] ?? null,
                'nama' => $nama,
                'kategori' => $validated['kategori'] ?? $fileType,
                'tipe' => $mime,
                'catatan' => $validated['catatan'] ?? null,
                'uploaded_by' => $request->user()->id,
            ]);

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

        return $this->success($files, 'File berhasil diupload.', 201);
    }

    /**
     * DELETE /api/mobile/upload/{id}
     */
    public function destroy(Request $request, string $id)
    {
        $dokumen = Dokumen::findOrFail($id);

        if ($dokumen->uploaded_by !== $request->user()->id && !$request->user()->isOwner()) {
            return $this->error('Anda tidak berhak menghapus file ini.', 403);
        }

        $dokumen->clearMediaCollection('file');
        $dokumen->delete();

        return $this->success(null, 'File berhasil dihapus.');
    }
}
