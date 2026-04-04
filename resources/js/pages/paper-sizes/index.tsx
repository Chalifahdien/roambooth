import { Head, useForm } from '@inertiajs/react';
import { Plus, Edit, Trash2, MoreVertical, Search, Maximize2 } from 'lucide-react';
import { useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
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
import paperSizesRoute from '@/routes/paper-sizes';
import { toast } from 'sonner';

interface PaperSize {
    id: number;
    name: string;
    width_mm: number;
    height_mm: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface Props {
    paperSizes: PaperSize[];
}

export default function PaperSizeIndex({ paperSizes }: Props) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedPaperSize, setSelectedPaperSize] = useState<PaperSize | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filteredPaperSizes = paperSizes.filter(paperSize => {
        const matchesSearch = paperSize.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && paperSize.is_active) ||
            (statusFilter === 'inactive' && !paperSize.is_active);

        return matchesSearch && matchesStatus;
    });

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        width_mm: 0,
        height_mm: 0,
        is_active: true,
    });

    const openCreateModal = () => {
        reset();
        clearErrors();
        setIsCreateModalOpen(true);
    };

    const openEditModal = (paperSize: PaperSize) => {
        setSelectedPaperSize(paperSize);
        setData({
            name: paperSize.name,
            width_mm: paperSize.width_mm,
            height_mm: paperSize.height_mm,
            is_active: paperSize.is_active,
        });
        clearErrors();
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (paperSize: PaperSize) => {
        setSelectedPaperSize(paperSize);
        setIsDeleteModalOpen(true);
    };

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        post(paperSizesRoute.store().url, {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                reset();
                toast.success('Paper size created successfully');
            },
        });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPaperSize) return;
        put(paperSizesRoute.update(selectedPaperSize.id).url, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                reset();
                toast.success('Paper size updated successfully');
            },
        });
    };

    const submitDelete = () => {
        if (!selectedPaperSize) return;
        destroy(paperSizesRoute.destroy(selectedPaperSize.id).url, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setSelectedPaperSize(null);
                toast.success('Paper size deleted successfully');
            },
        });
    };

    return (
        <>
            <Head title="Manage Paper Sizes" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Paper Sizes</h2>
                        <p className="text-muted-foreground">
                            Configure available paper sizes for your templates.
                        </p>
                    </div>
                    <Button onClick={openCreateModal}>
                        <Plus className="mr-2 h-4 w-4" /> Add Paper Size
                    </Button>
                </div>

                <div className="overflow-hidden rounded-xl border bg-card">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 border-b p-3 justify-between">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search paper sizes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-sidebar h-9 pl-9 w-full shadow-none focus-visible:ring-1"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {(searchQuery || statusFilter !== 'all') && (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setStatusFilter('all');
                                    }}
                                    className="h-9 px-3 text-xs"
                                >
                                    Reset Filters
                                </Button>
                            )}
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="h-9 w-[130px] bg-sidebar shadow-none focus:ring-1">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Table>
                        <TableHeader className='bg-sidebar'>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Width (mm)</TableHead>
                                <TableHead>Height (mm)</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPaperSizes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        {(searchQuery || statusFilter !== 'all')
                                            ? 'No paper sizes match your filters.'
                                            : 'No paper sizes found.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPaperSizes.map((paperSize) => (
                                    <TableRow key={paperSize.id}>
                                        <TableCell className="font-medium">{paperSize.name}</TableCell>
                                        <TableCell>{paperSize.width_mm} mm</TableCell>
                                        <TableCell>{paperSize.height_mm} mm</TableCell>
                                        <TableCell>
                                            <Badge variant={paperSize.is_active ? 'default' : 'secondary'}>
                                                {paperSize.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className='text-end'>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEditModal(paperSize)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => openDeleteModal(paperSize)}
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
                </div>
            </div>

            {/* Create Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent>
                    <form onSubmit={submitCreate}>
                        <DialogHeader>
                            <DialogTitle>Add Paper Size</DialogTitle>
                            <DialogDescription>
                                Define a new paper size for print templates.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g. 4R, 6R, etc."
                                />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="width_mm">Width (mm)</Label>
                                    <Input
                                        id="width_mm"
                                        type="number"
                                        value={data.width_mm}
                                        onChange={(e) => setData('width_mm', parseInt(e.target.value) || 0)}
                                    />
                                    {errors.width_mm && <p className="text-sm text-destructive">{errors.width_mm}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="height_mm">Height (mm)</Label>
                                    <Input
                                        id="height_mm"
                                        type="number"
                                        value={data.height_mm}
                                        onChange={(e) => setData('height_mm', parseInt(e.target.value) || 0)}
                                    />
                                    {errors.height_mm && <p className="text-sm text-destructive">{errors.height_mm}</p>}
                                </div>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                    <Label htmlFor="is_active">Is Active</Label>
                                    <p className="text-[0.8rem] text-muted-foreground">Enable or disable this paper size.</p>
                                </div>
                                <Switch
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(checked) => setData('is_active', checked)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Create Paper Size
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <form onSubmit={submitEdit}>
                        <DialogHeader>
                            <DialogTitle>Edit Paper Size</DialogTitle>
                            <DialogDescription>
                                Update paper size dimensions or status.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">Name</Label>
                                <Input
                                    id="edit-name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-width_mm">Width (mm)</Label>
                                    <Input
                                        id="edit-width_mm"
                                        type="number"
                                        value={data.width_mm}
                                        onChange={(e) => setData('width_mm', parseInt(e.target.value) || 0)}
                                    />
                                    {errors.width_mm && <p className="text-sm text-destructive">{errors.width_mm}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-height_mm">Height (mm)</Label>
                                    <Input
                                        id="edit-height_mm"
                                        type="number"
                                        value={data.height_mm}
                                        onChange={(e) => setData('height_mm', parseInt(e.target.value) || 0)}
                                    />
                                    {errors.height_mm && <p className="text-sm text-destructive">{errors.height_mm}</p>}
                                </div>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                    <Label htmlFor="edit-is_active">Is Active</Label>
                                    <p className="text-[0.8rem] text-muted-foreground">Enable or disable this paper size.</p>
                                </div>
                                <Switch
                                    id="edit-is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(checked) => setData('is_active', checked)}
                                />
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
                        <DialogTitle>Delete Paper Size</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{selectedPaperSize?.name}</strong>? This action cannot be undone.
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
        </>
    );
}

PaperSizeIndex.layout = {
    breadcrumbs: [
        {
            title: 'Paper Sizes',
            href: paperSizesRoute.index().url,
        },
    ],
};
