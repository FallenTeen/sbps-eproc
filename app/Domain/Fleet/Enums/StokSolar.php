<?php

namespace App\Domain\Fleet\Enums;

/**
 * Level indikator bahan bakar (bukan liter). Satu sumber kebenaran untuk
 * kolom enum `stok_solar`, validasi, dan opsi dropdown yang dikirim ke mobile.
 */
enum StokSolar: string
{
    case HampirHabis = 'hampir_habis';
    case Seperempat = 'seperempat';
    case Setengah = 'setengah';
    case TigaPerempat = 'tiga_perempat';
    case HampirPenuh = 'hampir_penuh';
    case Penuh = 'penuh';

    public function label(): string
    {
        return match ($this) {
            self::HampirHabis => 'Hampir habis',
            self::Seperempat => '1/4',
            self::Setengah => '1/2',
            self::TigaPerempat => '3/4',
            self::HampirPenuh => 'Hampir penuh',
            self::Penuh => 'Penuh',
        };
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /** @return list<array{value: string, label: string}> */
    public static function options(): array
    {
        return array_map(
            fn (self $c) => ['value' => $c->value, 'label' => $c->label()],
            self::cases()
        );
    }
}
