import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import Sidebar from '@/Components/Sidebar';
import NotificationBell from '@/Components/NotificationBell';
import Breadcrumb from '@/Components/Breadcrumb';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Menu } from 'lucide-react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeRole, setActiveRole] = useState(null);

    return (
        <div className="flex min-h-screen bg-slate-100 dark:bg-slate-900">
            {/* Adaptive Role-based Sidebar */}
            <Sidebar
                user={user}
                activeRole={activeRole}
                onRoleSwitch={(newRole) => setActiveRole(newRole)}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top Navigation Bar */}
                <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Mobile Sidebar Toggle Button */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden flex-shrink-0"
                        >
                            <Menu className="h-6 w-6" />
                        </button>

                        {/* Breadcrumb */}
                        <div className="hidden sm:block min-w-0 flex-1">
                            <Breadcrumb />
                        </div>
                    </div>

                    {/* Right: Notification Bell + User Dropdown */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <NotificationBell />

                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                    <span>{user.name}</span>
                                    <svg className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content>
                                <div className="px-4 py-2 border-b border-slate-100">
                                    <p className="text-xs text-slate-500">Masuk sebagai</p>
                                    <p className="text-sm font-semibold text-slate-700 truncate">{user.name}</p>
                                </div>
                                <Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
                                <Dropdown.Link href={route('logout')} method="post" as="button">Log Out</Dropdown.Link>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </header>

                {/* Page Header (if provided) */}
                {header && (
                    <div className="border-b border-slate-200 bg-white px-4 py-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:px-6 lg:px-8">
                        {header}
                    </div>
                )}

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

