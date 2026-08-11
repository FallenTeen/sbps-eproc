import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Menu, X, Bell } from 'lucide-react';

export default function Layout({ children }) {
    const { auth } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const menu = [
        { name: 'Dashboard', href: route('dashboard') },
        { name: 'Proyek & RAB', href: route('core.proyek.index') },
        { name: 'Procurement', children: [
            { name: 'Purchase Order', href: route('procurement.purchase-orders.index') },
            { name: 'Bahan Baku', href: route('procurement.bahan-baku.index') },
            { name: 'Supplier', href: route('procurement.suppliers.index') },
        ]},
        // ... modul lain
    ];

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
                                <Menu />
                            </button>
                            <div className="flex-shrink-0 flex items-center">
                                <Link href={route('dashboard')}>
                                    <span className="text-xl font-bold">E-Proc</span>
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button className="relative">
                                <Bell className="w-6 h-6" />
                                <span className="absolute top-0 right-0 inline-block w-2 h-2 bg-red-600 rounded-full"></span>
                            </button>
                            <span>{auth.user.name}</span>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex">
                {/* Sidebar */}
                <aside className={`bg-white w-64 min-h-screen shadow-lg fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition duration-200 ease-in-out z-30`}>
                    <div className="p-4">
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden float-right">
                            <X />
                        </button>
                        <nav className="mt-5 space-y-2">
                            {menu.map((item) => (
                                <div key={item.name}>
                                    {item.children ? (
                                        <div>
                                            <div className="font-medium text-gray-700">{item.name}</div>
                                            <div className="ml-4 space-y-1">
                                                {item.children.map((sub) => (
                                                    <Link key={sub.name} href={sub.href} className="block px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">
                                                        {sub.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <Link href={item.href} className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                                            {item.name}
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </nav>
                    </div>
                </aside>

                <main className="flex-1 p-6 lg:ml-64">
                    {children}
                </main>
            </div>
        </div>
    );
}
