import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const MainLayout = ({ children, title = 'Overview' }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Toggle Sidebar for mobile view
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <div className="flex w-full min-h-screen bg-slate-50 overflow-x-hidden">
            {/* Fixed Sidebar */}
            <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

            {/* Main Content Wrapper */}
            <div className="flex flex-col flex-1 min-w-0 transition-all duration-200 ml-0 lg:ml-[260px]">
                {/* Sticky Top Header */}
                <Topbar title={title} onMenuClick={toggleSidebar} />

                {/* Scrollable Page Content */}
                <main className="flex-1 w-full max-w-[1400px] mx-auto flex flex-col gap-8 p-4 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};
