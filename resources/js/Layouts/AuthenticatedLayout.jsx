import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import Sidebar from '@/Components/Sidebar';
import NotificationBell from '@/Components/NotificationBell';
import Breadcrumb from '@/Components/Breadcrumb';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeRole, setActiveRole] = useState(null);

    return (
        <div className="flex min-h-screen bg-white">
            <Sidebar
                user={user}
                activeRole={activeRole}
                onRoleSwitch={(newRole) => setActiveRole(newRole)}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="flex flex-1 flex-col overflow-hidden bg-white">
                <header className="flex h-16 items-center justify-between border-b-2 border-black bg-white px-4 sm:px-6 lg:px-8 shadow-bw-sm">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="rounded-none border-2 border-black p-2 text-black hover:bg-black hover:text-white md:hidden flex-shrink-0 transition-all shadow-bw-sm"
                            aria-label="Open menu"
                        >
                            <Menu className="h-5 w-5" />
                        </button>

                        <div className="hidden sm:block min-w-0 flex-1">
                            <Breadcrumb />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                        <NotificationBell />

                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="flex items-center gap-2 border-2 border-black bg-white px-3 py-1.5 text-xs font-black text-black hover:bg-black hover:text-white transition-all shadow-bw-sm">
                                    <span>{user.name}</span>
                                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content>
                                <div className="px-4 py-3 border-b-2 border-black bg-surface-muted">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-ink-secondary">Masuk sebagai</p>
                                    <p className="text-sm font-black text-ink.DEFAULT truncate mt-0.5">{user.name}</p>
                                    {user.email && <p className="text-xs text-ink-secondary truncate">{user.email}</p>}
                                </div>
                                <Dropdown.Link href={route('profile.edit')}>
                                    <span className="font-bold">Profile</span>
                                </Dropdown.Link>
                                <Dropdown.Link href={route('logout')} method="post" as="button">
                                    <span className="font-bold text-status-warning.DEFAULT">Log Out</span>
                                </Dropdown.Link>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </header>

                <div className="sm:hidden border-b-2 border-black bg-surface-muted px-3 py-2">
                    <Breadcrumb />
                </div>

                {header && (
                    <div className="border-b-2 border-black bg-white px-4 py-4 sm:px-6 lg:px-8 shadow-bw-sm">
                        {header}
                    </div>
                )}

                <main className="flex-1 overflow-y-auto bg-surface-muted p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
