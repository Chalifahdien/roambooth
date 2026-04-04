import { Link } from '@inertiajs/react';
import { BookOpen, FolderGit2, LayoutGrid, Monitor, Image as ImageIcon, FileText, Smile, ReceiptText, CreditCard, Ticket } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import machines from '@/routes/machines';
import paperSizes from '@/routes/paper-sizes';
import templates from '@/routes/templates';
import stickers from '@/routes/stickers';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Transactions',
        href: '/transactions',
        icon: ReceiptText,
    },
    {
        title: 'Gallery',
        href: '/gallery',
        icon: ImageIcon,
    },
    {
        title: 'Templates',
        href: templates.index(),
        icon: BookOpen,
    },
    {
        title: 'Machines',
        href: machines.index(),
        icon: Monitor,
    },
    {
        title: 'Stickers',
        href: stickers.index(),
        icon: Smile,
    },
    {
        title: 'Paper Sizes',
        href: paperSizes.index(),
        icon: FileText,
    },
    {
        title: 'Vouchers',
        href: '/vouchers',
        icon: Ticket,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                {/* <NavFooter items={footerNavItems} className="mt-auto" /> */}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
