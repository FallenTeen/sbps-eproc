<?php

namespace App\Domain\Security\Http\Controllers;

use App\Domain\Security\Models\SecurityChecklistRun;
use App\Domain\Security\Models\SecurityChecklistTemplate;
use App\Domain\Security\Models\SecurityChecklistTemplateItem;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * Web Security - master template Checklist Pemantauan Kantor (TD-F3).
 * Security mengisi run dari mobile; template dikelola di web.
 */
class ChecklistTemplateController extends Controller
{
    public function index()
    {
        return Inertia::render('Security/ChecklistTemplates', [
            'templates' => SecurityChecklistTemplate::with('items')->orderBy('nama')->get(),
            'runs' => SecurityChecklistRun::with('security:id,name')->latest('created_at')->take(20)->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validated($request);

        DB::transaction(function () use ($validated) {
            $template = SecurityChecklistTemplate::create([
                'nama' => $validated['nama'],
                'periode' => $validated['periode'],
                'jam_mulai' => $validated['jam_mulai'] ?? null,
                'jam_selesai' => $validated['jam_selesai'] ?? null,
                'hari' => $validated['hari'] ?? null,
                'aktif' => $validated['aktif'] ?? true,
                'dibuat_oleh' => Auth::id(),
            ]);

            $this->syncItems($template, $validated['items'] ?? []);
        });

        return back()->with('success', 'Template checklist dibuat.');
    }

    public function update(Request $request, SecurityChecklistTemplate $template)
    {
        $validated = $this->validated($request);

        DB::transaction(function () use ($validated, $template) {
            $template->update([
                'nama' => $validated['nama'],
                'periode' => $validated['periode'],
                'jam_mulai' => $validated['jam_mulai'] ?? null,
                'jam_selesai' => $validated['jam_selesai'] ?? null,
                'hari' => $validated['hari'] ?? null,
                'aktif' => $validated['aktif'] ?? true,
            ]);

            $this->syncItems($template, $validated['items'] ?? []);
        });

        return back()->with('success', 'Template checklist diperbarui.');
    }

    public function destroy(SecurityChecklistTemplate $template)
    {
        $template->delete();

        return back()->with('success', 'Template checklist dihapus.');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'nama' => 'required|string|max:150',
            'periode' => 'required|in:harian,malam,custom',
            'jam_mulai' => 'nullable|date_format:H:i',
            'jam_selesai' => 'nullable|date_format:H:i',
            'hari' => 'nullable|array',
            'hari.*' => 'string|max:10',
            'aktif' => 'sometimes|boolean',
            'items' => 'nullable|array',
            'items.*.teks' => 'required_with:items|string|max:500',
        ]);
    }

    private function syncItems(SecurityChecklistTemplate $template, array $items): void
    {
        $template->items()->delete();

        $urutan = 1;
        foreach ($items as $item) {
            $teks = is_array($item) ? ($item['teks'] ?? null) : $item;
            if (! $teks) continue;

            SecurityChecklistTemplateItem::create([
                'template_id' => $template->id,
                'urutan' => $urutan++,
                'teks' => $teks,
            ]);
        }
    }
}
