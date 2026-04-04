import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { SidebarProvider } from '@/components/ui/sidebar';
import type { AppVariant } from '@/types';

type Props = {
    children: ReactNode;
    variant?: AppVariant;
};

export function AppShell({ children, variant = 'sidebar' }: Props) {
    const isOpen = usePage().props.sidebarOpen;

    if (variant === 'header') {
        return (
            <div className="flex min-h-screen w-full flex-col">
                {children}
                <Toaster
                    closeButton
                    position="top-right"
                    toastOptions={{
                        unstyled: true,
                        classNames: {
                            toast: 'bg-sidebar border border-border rounded-xl p-4 flex items-center gap-3 w-full shadow-lg relative',
                            title: 'text-sm font-medium',
                            success: 'text-green-600 dark:text-green-400',
                            error: 'text-red-600 dark:text-red-400',
                            info: 'text-blue-600 dark:text-blue-400',
                            closeButton: 'absolute -top-2 -right-2 bg-sidebar border border-border rounded-full p-1 shadow-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors z-50',
                        },
                    }}
                />
            </div>
        );
    }

    return (
        <SidebarProvider defaultOpen={isOpen}>
            {children}
            <Toaster
                closeButton
                position="top-right"
                toastOptions={{
                    unstyled: true,
                    classNames: {
                        toast: 'bg-sidebar border border-border rounded-xl p-4 flex items-center gap-3 w-full shadow-lg relative',
                        title: 'text-sm font-medium',
                        success: 'text-green-600 dark:text-green-400',
                        error: 'text-red-600 dark:text-red-400',
                        info: 'text-blue-600 dark:text-blue-400',
                        closeButton: 'absolute -top-2 -right-2 bg-sidebar border border-border rounded-full p-1 shadow-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors z-50',
                    },
                }}
            />
        </SidebarProvider>
    );
}
