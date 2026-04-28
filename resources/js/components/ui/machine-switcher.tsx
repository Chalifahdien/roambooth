import { router, usePage } from '@inertiajs/react';
import { Monitor, ChevronsUpDown, Plus } from 'lucide-react';
import { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { CreateMachineModal } from '@/components/ui/create-machine-modal';

interface Machine {
    id: number;
    name: string;
    is_active: boolean;
}

export function MachineSwitcher() {
    const { machines, activeMachine } = usePage().props as unknown as { machines: Machine[], activeMachine: Machine | null };
    const { isMobile } = useSidebar();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleMachineSelect = (machineId: number) => {
        router.post('/machines/current', { machine_id: machineId }, {
            preserveState: false, // Force a full re-render with new data
        });
    };

    if (!machines || !Array.isArray(machines)) return null;

    return (
        <>
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                size="lg"
                                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            >
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                    <Monitor className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">
                                        {activeMachine ? activeMachine.name : 'All Machines'}
                                    </span>
                                    <span className="truncate text-xs">
                                        {activeMachine?.is_active ? 'Active' : 'Offline'}
                                    </span>
                                </div>
                                <ChevronsUpDown className="ml-auto" />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                            align="start"
                            side={isMobile ? 'bottom' : 'right'}
                            sideOffset={4}
                        >
                            <DropdownMenuLabel className="text-xs text-muted-foreground">
                                Mesin Photobooth
                            </DropdownMenuLabel>
                            {machines.map((machine, index) => (
                                <DropdownMenuItem
                                    key={machine.id}
                                    onClick={() => handleMachineSelect(machine.id)}
                                    className="gap-2 p-2"
                                >
                                    <div className="flex size-6 items-center justify-center rounded-sm border">
                                        <Monitor className="size-4 shrink-0" />
                                    </div>
                                    <span className="truncate">{machine.name}</span>
                                    {machine.id === activeMachine?.id && (
                                        <span className="ml-auto text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-md">Aktif</span>
                                    )}
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-2 p-2" onClick={() => setIsCreateModalOpen(true)}>
                                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                                    <Plus className="size-4" />
                                </div>
                                <div className="font-medium text-muted-foreground">Tambah Mesin Baru</div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>
            
            <CreateMachineModal 
                isOpen={isCreateModalOpen} 
                setIsOpen={setIsCreateModalOpen} 
            />
        </>
    );
}
