import React from "react";

const selectClass =
    "h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500";

function Options({ options = [] }) {
    return options.map((option) => (
        <option key={option.value} value={option.value}>
            {option.label}
        </option>
    ));
}

export default function FilterBar({ filter = {}, onChange }) {
    const handleChange = (key) => (event) => {
        onChange({
            ...filter,
            [key]: key === "rentang" ? Number(event.target.value) : event.target.value,
        });
    };

    return (
        <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm" aria-label="Filter ringkasan persediaan">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-gray-700">Sumber</span>
                    <select className={selectClass} value={filter.sumber ?? "semua"} onChange={handleChange("sumber")}>
                        <Options options={filter.sumber_options} />
                    </select>
                </label>
                <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-gray-700">Titik kerja</span>
                    <select className={selectClass} value={filter.titik ?? "semua"} onChange={handleChange("titik")}>
                        <Options options={filter.titik_options} />
                    </select>
                </label>
                <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-gray-700">Kategori</span>
                    <select className={selectClass} value={filter.kategori ?? "semua"} onChange={handleChange("kategori")}>
                        <Options options={filter.kategori_options} />
                    </select>
                </label>
                <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-gray-700">Rentang</span>
                    <select className={selectClass} value={filter.rentang ?? 30} onChange={handleChange("rentang")}>
                        <option value={7}>7 hari terakhir</option>
                        <option value={30}>30 hari terakhir</option>
                    </select>
                </label>
            </div>
        </section>
    );
}
