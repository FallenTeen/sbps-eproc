
import React, { useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import DataTable from '@/Components/DataTable';
import {
    Edit,
    ShieldCheck,
    TriangleAlert,
    Info,
    ShieldAlert,
} from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';

const APP_LABELS = {
    presensi: 'Presensi',
    proyek: 'Proyek (Produksi)',
    mobile: 'Mobile (SBPS Mobile)',
};

export default function Index({
    auth,
    appVersions,
    filters,
    sort,
    direction,
}) {
    const [showingEditModal, setShowingEditModal] = useState(false);
    const [showingConfirmModal, setShowingConfirmModal] = useState(false);
    const [editingVersion, setEditingVersion] = useState(null);
    const [acknowledged, setAcknowledged] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        latest_version: '',
        min_version: '',
        force_update: false,
        update_url: '',
        changelog: '',
    });

    const openEditModal = (appVersion) => {
        setEditingVersion(appVersion);

        setData({
            latest_version: appVersion.latest_version,
            min_version: appVersion.min_version,
            force_update: Boolean(appVersion.force_update),
            update_url: appVersion.update_url,
            changelog: appVersion.changelog || '',
        });

        setAcknowledged(false);
        setShowingEditModal(true);
    };

    // Menjelaskan dampak perubahan sebelum konfigurasi disimpan.
    const impacts = useMemo(() => {
        if (!editingVersion) return [];

        const list = [];

        if (data.min_version !== editingVersion.min_version) {
            list.push({
                level: 'danger',
                text: `Versi Minimal diubah dari ${editingVersion.min_version} menjadi ${data.min_version}. Pengguna yang versinya berada di bawah batas baru dapat terkena aturan Wajib Update jika fitur tersebut aktif.`,
            });
        }

        if (!editingVersion.force_update && data.force_update) {
            list.push({
                level: 'danger',
                text: `Wajib Update diaktifkan. Pengguna dengan versi terpasang di bawah ${data.min_version} dapat diminta memperbarui aplikasi sebelum melanjutkan. Pastikan versi pengganti sudah tersedia dan URL unduhan dapat diakses.`,
            });
        } else if (editingVersion.force_update && !data.force_update) {
            list.push({
                level: 'warning',
                text: 'Wajib Update dinonaktifkan. Pengguna yang sebelumnya terkena aturan update wajib dapat kembali melanjutkan penggunaan tanpa pemblokiran dari aturan ini, sesuai implementasi aplikasi.',
            });
        }

        if (data.latest_version !== editingVersion.latest_version) {
            list.push({
                level: 'warning',
                text: `Versi Terbaru diubah dari ${editingVersion.latest_version} menjadi ${data.latest_version}. Aplikasi dapat mendeteksi adanya versi baru dan menawarkan pembaruan. Perubahan ini sendiri tidak mengaktifkan pemblokiran update.`,
            });
        }

        if (data.update_url !== editingVersion.update_url) {
            list.push({
                level: 'info',
                text: `URL unduhan diubah menjadi ${data.update_url || '(kosong)'}. Pastikan URL menggunakan HTTPS, mengarah ke sumber resmi, dan menyediakan paket yang sesuai dengan platform aplikasi.`,
            });
        }

        if ((data.changelog || '') !== (editingVersion.changelog || '')) {
            list.push({
                level: 'info',
                text: 'Changelog diubah. Catatan perubahan yang ditampilkan pada dialog update akan mengikuti nilai terbaru sesuai implementasi aplikasi.',
            });
        }

        return list;
    }, [editingVersion, data]);

    const hasChanges = impacts.length > 0;

    const submitEdit = (e) => {
        e.preventDefault();

        if (!hasChanges) {
            setShowingEditModal(false);
            return;
        }

        setShowingEditModal(false);
        setAcknowledged(false);
        setShowingConfirmModal(true);
    };

    const confirmSave = () => {
        if (!acknowledged || processing || !editingVersion) return;

        put(route('core.app-version.update', editingVersion.id), {
            onSuccess: () => {
                setShowingConfirmModal(false);
                setEditingVersion(null);
                setAcknowledged(false);
            },
        });
    };

    const columns = [
        {
            key: 'app',
            label: 'App',
            type: 'select',
            options: [
                { value: 'mobile', label: 'Mobile (SBPS Mobile)' },
                { value: 'presensi', label: 'Presensi' },
                { value: 'proyek', label: 'Proyek (Produksi)' },
            ],
            cellClassName:
                'px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900',
            render: (v) => APP_LABELS[v.app] || v.app,
        },
        {
            key: 'platform',
            label: 'Platform',
            type: 'select',
            options: [
                { value: 'android', label: 'Android' },
                { value: 'ios', label: 'iOS' },
            ],
            render: (v) => (
                <span className="capitalize">{v.platform}</span>
            ),
        },
        {
            key: 'latest_version',
            label: 'Versi Terbaru',
            type: 'text',
            cellClassName:
                'px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900',
        },
        {
            key: 'min_version',
            label: 'Versi Minimal',
            type: 'text',
            cellClassName:
                'px-4 py-3 whitespace-nowrap text-sm text-gray-900',
        },
        {
            key: 'force_update',
            label: 'Wajib Update',
            type: 'select',
            options: [
                { value: '1', label: 'Ya' },
                { value: '0', label: 'Tidak' },
            ],
            render: (v) => (
                <span
                    className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        v.force_update
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                    }`}
                >
                    {v.force_update ? 'Wajib Update' : 'Opsional'}
                </span>
            ),
        },
        {
            key: 'aksi',
            label: 'Aksi',
            search: false,
            sortable: false,
            align: 'right',
            cellClassName:
                'px-4 py-3 whitespace-nowrap text-right text-sm font-medium',
            render: (v) => (
                <button
                    type="button"
                    onClick={() => openEditModal(v)}
                    className="inline-flex items-center text-amber-600 hover:text-amber-900 font-medium"
                    title="Edit Konfigurasi"
                >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                </button>
            ),
        },
    ];

    const impactStyles = {
        danger: 'bg-red-50 border-red-300 text-red-900',
        warning: 'bg-amber-50 border-amber-300 text-amber-900',
        info: 'bg-blue-50 border-blue-300 text-blue-900',
    };

    const impactIcons = {
        danger: (
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
        ),
        warning: (
            <TriangleAlert className="w-5 h-5 shrink-0 mt-0.5" />
        ),
        info: <Info className="w-5 h-5 shrink-0 mt-0.5" />,
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Versi Aplikasi Mobile (Version Gate)
                </h2>
            }
        >
            <Head title="Versi Aplikasi Mobile" />

            {/* Padding atas diperkecil dari py-12 */}
            <div className="">
                <div className="mx-auto">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        {/* DISCLAIMER DAN PANDUAN */}
                        <div className="mb-5 space-y-3">
                            <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-3">
                                <div className="p-2 bg-amber-100 text-amber-700 rounded-full shrink-0">
                                    <TriangleAlert className="w-5 h-5" />
                                </div>

                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-amber-950">
                                        Perhatian: konfigurasi ini mengatur
                                        akses pengguna ke aplikasi mobile.
                                    </p>

                                    <div className="mt-2 space-y-2 text-xs leading-5 text-amber-950">
                                        <p>
                                            Perubahan disimpan ke server dan
                                            dapat memengaruhi pengguna ketika
                                            aplikasi mengambil konfigurasi
                                            terbaru. Halaman ini tidak
                                            menyediakan proses review atau
                                            preview otomatis. Periksa kembali
                                            seluruh nilai sebelum menyimpan.
                                        </p>

                                        <p>
                                            <b>Risiko utama:</b> jika Wajib
                                            Update diaktifkan dan Versi Minimal
                                            dinaikkan terlalu tinggi, pengguna
                                            dengan versi di bawah batas tersebut
                                            dapat diminta memperbarui aplikasi
                                            sebelum melanjutkan. Jika versi
                                            pengganti belum tersedia, URL
                                            unduhan salah, atau APK tidak
                                            kompatibel, pengguna dapat
                                            mengalami kesulitan memperbarui
                                            aplikasi.
                                        </p>

                                        <p>
                                            Sebelum menyimpan, pastikan versi
                                            target sudah benar, paket aplikasi
                                            tersedia untuk diunduh, dan URL
                                            mengarah ke sumber resmi yang dapat
                                            diakses. Jika ragu, batalkan
                                            perubahan dan konsultasikan dengan
                                            tim IT.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                                <div className="p-2 bg-blue-100 text-blue-700 rounded-full shrink-0">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-blue-950">
                                        Panduan memahami setiap konfigurasi
                                    </p>

                                    <div className="mt-3 space-y-3 text-xs leading-5 text-gray-700">
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                1. Versi Terbaru
                                                (latest_version)
                                            </p>
                                            <p>
                                                Menunjukkan versi rilis terbaru
                                                yang diinformasikan kepada
                                                aplikasi. Nilai ini digunakan
                                                oleh mekanisme pemeriksaan
                                                update untuk menentukan apakah
                                                versi baru tersedia. Perubahan
                                                nilai ini saja tidak otomatis
                                                memblokir pengguna. Pastikan
                                                versi yang diinformasikan
                                                benar-benar tersedia untuk
                                                diunduh.
                                            </p>
                                        </div>

                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                2. Versi Minimal (min_version)
                                            </p>
                                            <p>
                                                Menentukan batas versi yang
                                                dianggap masih memenuhi
                                                persyaratan. Jika Wajib Update
                                                aktif, versi di bawah batas
                                                ini dapat diminta memperbarui
                                                aplikasi sebelum melanjutkan.
                                                Menaikkan batas terlalu tinggi
                                                dapat memaksa pengguna
                                                memperbarui lebih cepat dari
                                                yang direncanakan. Perubahan
                                                batas ini sendiri tidak selalu
                                                memblokir pengguna jika Wajib
                                                Update nonaktif.
                                            </p>
                                        </div>

                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                3. Wajib Update (force_update)
                                            </p>
                                            <p>
                                                Jika aktif, pengguna yang
                                                versinya berada di bawah Versi
                                                Minimal akan terkena aturan
                                                update wajib sesuai implementasi
                                                aplikasi. Mereka dapat kehilangan
                                                akses untuk melanjutkan
                                                penggunaan sampai memasang versi
                                                yang memenuhi persyaratan.
                                                Aktifkan hanya setelah versi
                                                pengganti tersedia dan proses
                                                pembaruannya sudah diuji.
                                            </p>
                                        </div>

                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                4. URL Unduh Update (update_url)
                                            </p>
                                            <p>
                                                Alamat yang dibuka pengguna
                                                untuk memperoleh pembaruan.
                                                Untuk Android, pastikan tautan
                                                menuju APK yang benar atau
                                                halaman unduhan resmi yang
                                                menyediakan APK tersebut.
                                                Gunakan HTTPS, periksa akses
                                                unduhan, dan pastikan file
                                                sesuai dengan aplikasi yang
                                                terpasang. HTTPS saja tidak
                                                menjamin file benar atau
                                                kompatibel.
                                            </p>
                                            <p className="mt-1">
                                                Untuk iOS, pastikan tautan dan
                                                alur pembaruan mengikuti
                                                mekanisme distribusi iOS yang
                                                digunakan. APK tidak berlaku
                                                untuk iOS.
                                            </p>
                                        </div>

                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                5. Changelog
                                            </p>
                                            <p>
                                                Berisi ringkasan perubahan yang
                                                ditampilkan pada dialog update
                                                sesuai implementasi aplikasi.
                                                Jelaskan perbaikan, fitur baru,
                                                atau masalah yang telah
                                                diperbaiki agar pengguna
                                                memahami alasan pembaruan.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 p-3 bg-white border border-blue-200 rounded-md">
                                        <p className="text-xs font-bold text-blue-950">
                                            Catatan penting tentang Shorebird
                                        </p>

                                        <p className="text-xs leading-5 text-gray-700 mt-1">
                                            Shorebird patch memungkinkan
                                            perubahan kode tertentu dikirim
                                            tanpa menerbitkan APK baru melalui
                                            store. Patch tidak dengan
                                            sendirinya menaikkan versi native
                                            aplikasi. Karena itu, jangan
                                            menaikkan Versi Terbaru atau Versi
                                            Minimal hanya karena patch telah
                                            dikirim. Jika perubahan memerlukan
                                            perubahan native, tidak didukung
                                            patch, atau membutuhkan rilis baru,
                                            ikuti proses rilis yang sesuai.
                                            Pastikan perilaku Version Gate pada
                                            aplikasi telah diuji untuk skenario
                                            tersebut.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* TABEL KONFIGURASI */}
                        <div className="mb-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                            <h3 className="text-lg font-bold text-gray-900">
                                Daftar Konfigurasi Versi
                            </h3>

                            <span className="text-xs text-gray-500 font-medium">
                                Total {appVersions.total} konfigurasi
                            </span>
                        </div>

                        <DataTable
                            routeName="core.app-version.index"
                            columns={columns}
                            rows={appVersions}
                            filters={filters}
                            sort={sort}
                            direction={direction}
                            emptyMessage="Belum ada konfigurasi versi."
                        />
                    </div>
                </div>
            </div>

            {/* MODAL EDIT */}
            <Modal
                show={showingEditModal}
                onClose={() => setShowingEditModal(false)}
                title={`Edit Versi: ${
                    editingVersion
                        ? `${APP_LABELS[editingVersion.app] || editingVersion.app} (${editingVersion.platform})`
                        : ''
                }`}
            >
                <form onSubmit={submitEdit} className="p-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <InputLabel
                                    htmlFor="latest_version"
                                    value="Versi Terbaru (latest)"
                                />

                                <TextInput
                                    id="latest_version"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.latest_version}
                                    onChange={(e) =>
                                        setData(
                                            'latest_version',
                                            e.target.value
                                        )
                                    }
                                    required
                                    placeholder="1.0.0"
                                />

                                <p className="text-xs leading-5 text-gray-500 mt-1">
                                    Versi rilis terbaru yang diinformasikan
                                    kepada aplikasi. Perubahan ini saja tidak
                                    otomatis memblokir pengguna. Pastikan
                                    rilis tersebut tersedia untuk diunduh.
                                </p>

                                <InputError
                                    message={errors.latest_version}
                                    className="mt-2"
                                />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="min_version"
                                    value="Versi Minimal (min)"
                                />

                                <TextInput
                                    id="min_version"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.min_version}
                                    onChange={(e) =>
                                        setData('min_version', e.target.value)
                                    }
                                    required
                                    placeholder="1.0.0"
                                />

                                <p className="text-xs leading-5 text-gray-500 mt-1">
                                    Batas versi minimum yang diperbolehkan.
                                    Jika Wajib Update aktif, pengguna dengan
                                    versi di bawah batas ini dapat diminta
                                    memperbarui aplikasi sebelum melanjutkan.
                                </p>

                                <InputError
                                    message={errors.min_version}
                                    className="mt-2"
                                />
                            </div>
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="update_url"
                                value="URL Unduh Update"
                            />

                            <TextInput
                                id="update_url"
                                type="url"
                                className="mt-1 block w-full"
                                value={data.update_url}
                                onChange={(e) =>
                                    setData('update_url', e.target.value)
                                }
                                required
                                placeholder="https://..."
                            />

                            <p className="text-xs leading-5 text-gray-500 mt-1">
                                Tautan yang dibuka untuk memperoleh pembaruan.
                                Pastikan menggunakan HTTPS, mengarah ke sumber
                                resmi, dan menyediakan paket yang benar untuk
                                platform terkait.
                            </p>

                            <InputError
                                message={errors.update_url}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="changelog"
                                value="Changelog"
                            />

                            <textarea
                                id="changelog"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                rows={4}
                                value={data.changelog}
                                onChange={(e) =>
                                    setData('changelog', e.target.value)
                                }
                                placeholder="Catatan perubahan yang ditampilkan kepada pengguna aplikasi"
                            />

                            <p className="text-xs leading-5 text-gray-500 mt-1">
                                Jelaskan perubahan yang relevan bagi pengguna,
                                seperti perbaikan bug, peningkatan stabilitas,
                                atau fitur baru.
                            </p>

                            <InputError
                                message={errors.changelog}
                                className="mt-2"
                            />
                        </div>

                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                            <div className="flex items-start gap-3">
                                <TriangleAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />

                                <div className="min-w-0">
                                    <div className="flex items-start">
                                        <input
                                            id="force_update"
                                            type="checkbox"
                                            className="mt-1 rounded border-gray-300 text-amber-600 shadow-sm focus:ring-amber-500"
                                            checked={data.force_update}
                                            onChange={(e) =>
                                                setData(
                                                    'force_update',
                                                    e.target.checked
                                                )
                                            }
                                        />

                                        <label
                                            htmlFor="force_update"
                                            className="ml-2 block text-sm font-semibold text-gray-900"
                                        >
                                            Wajib Update (force_update)
                                        </label>
                                    </div>

                                    <p className="text-xs leading-5 text-gray-700 mt-2">
                                        Jika aktif, pengguna dengan versi
                                        terpasang di bawah Versi Minimal dapat
                                        diminta memperbarui aplikasi sebelum
                                        melanjutkan. Pastikan versi pengganti
                                        tersedia, URL unduhan benar, dan paket
                                        dapat dipasang pada perangkat pengguna.
                                    </p>

                                    <p className="text-xs leading-5 text-gray-700 mt-2">
                                        Jika nonaktif, batas Versi Minimal
                                        tidak otomatis menyebabkan pemblokiran
                                        melalui aturan Wajib Update ini.
                                        Perilaku lain tetap bergantung pada
                                        implementasi aplikasi.
                                    </p>

                                    <p className="text-xs leading-5 text-gray-700 mt-2">
                                        Shorebird patch tidak dengan sendirinya
                                        menaikkan versi native. Jangan memaksa
                                        update hanya karena patch dikirim jika
                                        tidak ada kebutuhan untuk menerbitkan
                                        rilis aplikasi baru.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t">
                        <SecondaryButton
                            type="button"
                            onClick={() => setShowingEditModal(false)}
                        >
                            Batal
                        </SecondaryButton>

                        <PrimaryButton
                            type="submit"
                            disabled={processing || !hasChanges}
                        >
                            {hasChanges
                                ? 'Lanjut — Rincian Dampak'
                                : 'Tidak Ada Perubahan'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* MODAL KONFIRMASI */}
            <Modal
                show={showingConfirmModal}
                onClose={() => {
                    if (!processing) {
                        setShowingConfirmModal(false);
                    }
                }}
                title="Periksa Dampak Perubahan Sebelum Simpan"
            >
                <div className="p-6">
                    <div className="mb-4 p-4 bg-amber-50 border border-amber-300 rounded-md flex items-start gap-3">
                        <TriangleAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />

                        <div className="text-xs leading-5 text-amber-950">
                            <p className="font-bold text-sm">
                                Pastikan Anda memahami dampak perubahan ini.
                            </p>

                            <ul className="list-disc pl-4 mt-2 space-y-1">
                                <li>
                                    Perubahan konfigurasi disimpan di server
                                    dan akan berdampak ketika aplikasi
                                    mengambil konfigurasi tersebut.
                                </li>
                                <li>
                                    Perubahan Versi Minimal dan aktivasi Wajib
                                    Update dapat menyebabkan pengguna dengan
                                    versi lama harus memperbarui aplikasi
                                    sebelum melanjutkan.
                                </li>
                                <li>
                                    Jika versi pengganti belum tersedia atau
                                    URL unduhan bermasalah, pengguna dapat
                                    mengalami kesulitan memperbarui aplikasi.
                                </li>
                                <li>
                                    Periksa rincian dampak di bawah. Jika nilai
                                    versi, status Wajib Update, atau URL belum
                                    terverifikasi, kembali dan periksa ulang
                                    sebelum menyimpan.
                                </li>
                            </ul>
                        </div>
                    </div>

                    <p className="text-sm font-semibold text-gray-900 mb-3">
                        Konfigurasi{' '}
                        {editingVersion
                            ? `${APP_LABELS[editingVersion.app] || editingVersion.app} (${editingVersion.platform})`
                            : ''}{' '}
                        akan diubah:
                    </p>

                    <div className="space-y-2 mb-6">
                        {impacts.map((impact, i) => (
                            <div
                                key={i}
                                className={`p-3 border rounded-md flex items-start gap-3 text-xs leading-5 ${impactStyles[impact.level]}`}
                            >
                                {impactIcons[impact.level]}
                                <span className="min-w-0 break-words">
                                    {impact.text}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-start gap-3 mb-6">
                        <input
                            id="acknowledged"
                            type="checkbox"
                            className="mt-1 rounded border-gray-300 text-amber-600 shadow-sm focus:ring-amber-500"
                            checked={acknowledged}
                            onChange={(e) =>
                                setAcknowledged(e.target.checked)
                            }
                        />

                        <label
                            htmlFor="acknowledged"
                            className="text-xs leading-5 text-gray-700"
                        >
                            Saya telah memeriksa nilai versi, status Wajib
                            Update, URL unduhan, dan rincian dampak di atas.
                            Saya memahami risiko perubahan ini dan memastikan
                            konfigurasi sesuai dengan rencana rilis.
                        </label>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t">
                        <SecondaryButton
                            type="button"
                            onClick={() => {
                                setShowingConfirmModal(false);
                                setShowingEditModal(true);
                            }}
                            disabled={processing}
                        >
                            Kembali & Periksa Ulang
                        </SecondaryButton>

                        <PrimaryButton
                            type="button"
                            onClick={confirmSave}
                            disabled={!acknowledged || processing}
                        >
                            {processing
                                ? 'Menyimpan...'
                                : 'Saya Paham — Simpan'}
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
