import React, { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import {
    Boxes,
    ClipboardCheck,
    LayoutDashboard,
    List,
    PackageSearch,
} from "lucide-react";
import RingkasanTab from "./Partials/RingkasanTab";
import FilterBar from "./Partials/FilterBar";
import KanbanTab from "./Partials/KanbanTab";
import MutasiTab from "./Partials/MutasiTab";
import SaldoTab from "./Partials/SaldoTab";
import OpnameTab from "./Partials/OpnameTab";

const tabs = [
    { value: "ringkasan", label: "Ringkasan", icon: LayoutDashboard },
    { value: "kanban", label: "Kanban", icon: Boxes },
    { value: "mutasi", label: "Mutasi", icon: List },
    { value: "saldo", label: "Saldo", icon: PackageSearch },
    { value: "opname", label: "Opname", icon: ClipboardCheck },
];

export default function Index({ dashboard = {}, metrics = {} }) {
    const [tab, setTab] = useState("ringkasan");
    const [filter, setFilter] = useState(() => dashboard.filter ?? {});

    const handleFilterChange = (next) => {
        setFilter(next);
        router.get(route("inventory.dashboard"), next, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Ringkasan Persediaan" />

            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Ringkasan Persediaan</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Pantau arus barang, saldo, selisih opname, dan tindakan yang perlu diprioritaskan.
                    </p>
                </div>
                <Link
                    href={route("procurement.bahan-baku.index")}
                    className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                    Data barang
                </Link>
            </div>

            <FilterBar filter={filter} onChange={handleFilterChange} />

            <Tabs value={tab} onValueChange={setTab} className="flex-col gap-4">
                <div className="w-full overflow-x-auto overflow-y-hidden pb-1">
                    <TabsList className="h-auto w-fit min-w-max gap-1 rounded-md border bg-muted p-1" aria-label="Bagian ringkasan persediaan">
                        {tabs.map(({ value, label, icon: Icon }) => (
                            <TabsTrigger
                                key={value}
                                value={value}
                                className={`h-9 shrink-0 gap-2 rounded-md px-3.5 text-sm transition-colors ${
                                    tab === value
                                        ? "!bg-gray-900 !font-semibold !text-white shadow-sm"
                                        : "text-muted-foreground hover:bg-background hover:text-foreground"
                                }`}
                            >
                                <Icon className="h-4 w-4" /> {label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <TabsContent value="ringkasan" className="space-y-4">
                    <RingkasanTab dashboard={dashboard} metrics={metrics} />
                </TabsContent>
                <TabsContent value="kanban" className="space-y-4">
                    <KanbanTab kanban={dashboard.kanban} />
                </TabsContent>
                <TabsContent value="mutasi" className="space-y-4">
                    <MutasiTab mutasi={dashboard.mutasi} />
                </TabsContent>
                <TabsContent value="saldo" className="space-y-4">
                    <SaldoTab saldo={dashboard.saldo} />
                </TabsContent>
                <TabsContent value="opname" className="space-y-4">
                    <OpnameTab opname={dashboard.opname} />
                </TabsContent>
            </Tabs>
        </AuthenticatedLayout>
    );
}
