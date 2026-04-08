import { Head, useForm, router } from '@inertiajs/react';
import { Plus, Edit, Trash2, MoreVertical, Copy, Ticket, Search, RefreshCw, Printer } from 'lucide-react';
import { useState } from 'react';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import vouchersRoute from '@/routes/vouchers';
import { toast } from 'sonner';

interface Voucher {
    id: number;
    code: string;
    type: 'koran' | 'reguler' | 'flipbook';
    status: 'ready' | 'used';
    limit: number;
    used_count: number;
    created_at: string;
    updated_at: string;
}

interface LinkProp {
    url: string | null;
    label: string;
    active: boolean;
}

interface VoucherPaginator {
    data: Voucher[];
    links: LinkProp[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

interface Props {
    vouchers: VoucherPaginator;
    filters: {
        search?: string;
        type?: string;
        status?: string;
    };
}

export default function VoucherIndex({ vouchers, filters }: Props) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
    const [printingVoucher, setPrintingVoucher] = useState<Voucher | null>(null);
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');

    const handleFilter = (key: string, value: string) => {
        const newFilters = {
            search: searchQuery,
            type: typeFilter,
            status: statusFilter,
            [key]: value,
        };

        router.get(vouchersRoute.index({ query: newFilters }).url, {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilter('search', searchQuery);
    };

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        code: '',
        type: 'reguler' as 'koran' | 'reguler' | 'flipbook',
        status: 'ready' as 'ready' | 'used',
        limit: 1,
    });

    const openCreateModal = () => {
        reset();
        clearErrors();
        setIsCreateModalOpen(true);
    };

    const openEditModal = (voucher: Voucher) => {
        setSelectedVoucher(voucher);
        setData({
            code: voucher.code,
            type: voucher.type,
            status: voucher.status,
            limit: voucher.limit,
        });
        clearErrors();
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (voucher: Voucher) => {
        setSelectedVoucher(voucher);
        setIsDeleteModalOpen(true);
    };

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        post(vouchersRoute.store().url, {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                reset();
                toast.success('Voucher created successfully');
            },
        });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVoucher) return;
        put(vouchersRoute.update(selectedVoucher.id).url, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                reset();
                toast.success('Voucher updated successfully');
            },
        });
    };

    const submitDelete = () => {
        if (!selectedVoucher) return;
        destroy(vouchersRoute.destroy(selectedVoucher.id).url, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setSelectedVoucher(null);
                toast.success('Voucher deleted successfully');
            },
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Code copied to clipboard');
    };

    const handlePrint = (voucher: Voucher) => {
        setPrintingVoucher(voucher);
        // Memberikan waktu sebentar agar React merender area print sebelum window.print dipanggil
        setTimeout(() => {
            window.print();
        }, 100);
    };

    return (
        <>
            <Head title="Manage Vouchers" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 print:hidden">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Vouchers</h2>
                        <p className="text-muted-foreground">
                            Manage photobooth transaction vouchers here.
                        </p>
                    </div>
                    <Button onClick={openCreateModal}>
                        <Plus className="mr-2 h-4 w-4" /> Add Voucher
                    </Button>
                </div>

                <div className="overflow-hidden rounded-xl border bg-card">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 border-b p-3 justify-between">
                        <form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by exact voucher code..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-sidebar h-9 pl-9 w-full shadow-none focus-visible:ring-1"
                            />
                        </form>
                        <div className="flex flex-wrap items-center gap-2">
                            {(filters.search || filters.type !== 'all' || filters.status !== 'all') && (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setTypeFilter('all');
                                        setStatusFilter('all');
                                        router.get(vouchersRoute.index().url);
                                    }}
                                    className="h-9 px-3 text-xs"
                                >
                                    Reset Filters
                                </Button>
                            )}

                            <Select value={typeFilter} onValueChange={(val) => {
                                setTypeFilter(val);
                                handleFilter('type', val);
                            }}>
                                <SelectTrigger className="h-9 w-[130px] bg-sidebar shadow-none focus:ring-1">
                                    <SelectValue placeholder="Concept Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="reguler">Reguler</SelectItem>
                                    <SelectItem value="koran">Koran</SelectItem>
                                    <SelectItem value="flipbook">Flipbook</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={statusFilter} onValueChange={(val) => {
                                setStatusFilter(val);
                                handleFilter('status', val);
                            }}>
                                <SelectTrigger className="h-9 w-[130px] bg-sidebar shadow-none focus:ring-1">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="ready">Ready</SelectItem>
                                    <SelectItem value="used">Used</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Table>
                        <TableHeader className='bg-sidebar'>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Template Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Usage Limit</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead>Updated At</TableHead>
                                <TableHead className="text-right"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vouchers.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        {(filters.search || filters.type !== 'all' || filters.status !== 'all')
                                            ? 'No vouchers match your filters.'
                                            : 'No vouchers found.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                vouchers.data.map((voucher) => (
                                    <TableRow key={voucher.id}>
                                        <TableCell className="font-mono font-bold tracking-wider text-primary">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                                    onClick={() => copyToClipboard(voucher.code)}
                                                    title="Copy Code"
                                                >
                                                    <Copy className="h-3.5 w-3.5" />
                                                </Button>
                                                {voucher.code}

                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="uppercase text-[10px]">
                                                {voucher.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={voucher.status === 'ready' ? 'default' : 'secondary'}>
                                                {voucher.status === 'ready' ? 'Ready' : 'Used'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <span className="font-medium text-foreground">{voucher.used_count}</span>
                                                <span className="text-muted-foreground">/</span>
                                                <span className="font-medium text-muted-foreground">{voucher.limit}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                            {new Date(voucher.created_at).toLocaleDateString('id-ID', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                            {new Date(voucher.updated_at).toLocaleDateString('id-ID', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </TableCell>
                                        <TableCell className='text-end'>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handlePrint(voucher)}>
                                                        <Printer className="mr-2 h-4 w-4" /> Print Voucher
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openEditModal(voucher)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => openDeleteModal(voucher)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4 text-destructive" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    <div className="border-t bg-sidebar/50">
                        <Pagination links={vouchers.links} className="py-3" />
                    </div>
                </div>
            </div>

            {/* Create Voucher Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent>
                    <form onSubmit={submitCreate}>
                        <DialogHeader>
                            <DialogTitle>Generate Voucher</DialogTitle>
                            <DialogDescription>
                                Choose the photo concept type. An 8-character unique voucher code will be automatically generated with a ready status.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="type">Concept Type</Label>
                                <Select value={data.type} onValueChange={(val: any) => setData('type', val)}>
                                    <SelectTrigger id="type" className="w-full">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="reguler">Reguler</SelectItem>
                                        <SelectItem value="koran">Koran</SelectItem>
                                        <SelectItem value="flipbook">Flipbook</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="limit">Usage Limit</Label>
                                <Input
                                    id="limit"
                                    type="number"
                                    min="1"
                                    value={data.limit}
                                    onChange={(e) => setData('limit', parseInt(e.target.value) || 1)}
                                />
                                {errors.limit && <p className="text-sm text-destructive">{errors.limit}</p>}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Create Voucher
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Voucher Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <form onSubmit={submitEdit}>
                        <DialogHeader>
                            <DialogTitle>Edit Voucher</DialogTitle>
                            <DialogDescription>
                                Update the details of your voucher.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-code">Voucher Code</Label>
                                <Input
                                    id="edit-code"
                                    value={data.code}
                                    readOnly
                                    disabled
                                    className="bg-muted font-mono uppercase tracking-widest pointer-events-none"
                                />
                                {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-type">Concept Type</Label>
                                    <Select value={data.type} onValueChange={(val: any) => setData('type', val)}>
                                        <SelectTrigger id="edit-type" className="w-full">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="reguler">Reguler</SelectItem>
                                            <SelectItem value="koran">Koran</SelectItem>
                                            <SelectItem value="flipbook">Flipbook</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="edit-status">Status</Label>
                                    <Select value={data.status} onValueChange={(val: any) => setData('status', val)}>
                                        <SelectTrigger id="edit-status" className="w-full">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ready">Ready</SelectItem>
                                            <SelectItem value="used">Used</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.status && <p className="text-sm text-destructive">{errors.status}</p>}
                                </div>
                                <div className="grid gap-2 col-span-2">
                                    <Label htmlFor="edit-limit">Usage Limit</Label>
                                    <Input
                                        id="edit-limit"
                                        type="number"
                                        min="1"
                                        value={data.limit}
                                        onChange={(e) => setData('limit', parseInt(e.target.value) || 1)}
                                    />
                                    {errors.limit && <p className="text-sm text-destructive">{errors.limit}</p>}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Voucher</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete voucher code <strong className="font-mono tracking-widest">{selectedVoucher?.code}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={submitDelete} disabled={processing}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Print Area - Hidden by default, visible only during print */}
            <div id="voucher-print-area" className="hidden print:block bg-white fixed inset-0 z-50">
                {printingVoucher && (
                    <div className="flex items-center justify-center min-h-screen w-full bg-white">
                        <div
                            className="border-4 border-black p-10 flex flex-col items-center justify-center text-center bg-white shadow-none mx-auto"
                            style={{
                                width: '15cm',
                                height: '10cm',
                                aspectRatio: '3/2',
                                pageBreakInside: 'avoid'
                            }}
                        >
                            <div className="mb-4">
                                <Ticket className="h-12 w-12 mb-2 mx-auto text-black" />
                                <h1 className="text-xl font-black uppercase tracking-widest border-b-2 border-black pb-1 mb-2">
                                    Roambooth Voucher
                                </h1>
                            </div>

                            <div className="flex flex-col gap-1 items-center mb-8">
                                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">
                                    Voucher Code
                                </span>
                                <h2 className="text-5xl font-black tracking-widest font-mono border-2 border-black px-4 py-2 bg-black text-white">
                                    {printingVoucher.code}
                                </h2>
                            </div>

                            <div className="flex flex-col gap-1 items-center">
                                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">
                                    Validity Type
                                </span>
                                <div className="text-xl font-bold uppercase tracking-widest">
                                    {printingVoucher.type} Concept
                                </div>
                            </div>

                            <div className="mt-auto pt-4 text-[8px] uppercase tracking-tighter font-medium text-gray-400">
                                This voucher is valid for single use only. Scan at the booth to start your session.
                            </div>
                        </div>
                    </div>
                )}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media print {
                        @page { size: landscape; margin: 0; }
                        body { margin: 0 !important; padding: 0 !important; background: white !important; }
                        #voucher-print-area { 
                            display: block !important; 
                            position: fixed !important;
                            top: 0 !important;
                            left: 0 !important;
                            width: 100vw !important;
                            height: 100vh !important;
                            z-index: 9999 !important;
                        }
                    }
                `}} />
            </div>
        </>
    );
}

VoucherIndex.layout = {
    breadcrumbs: [
        {
            title: 'Vouchers',
            href: '/vouchers',
        },
    ],
};
