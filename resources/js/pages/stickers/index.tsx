import { Head, useForm, router } from '@inertiajs/react';
import { Plus, Edit, Trash2, MoreVertical, Search, Image as ImageIcon, Check, X } from 'lucide-react';
import { useState, useRef } from 'react';
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
import stickersRoute from '@/routes/stickers';
import { toast } from 'sonner';

interface Sticker {
    id: number;
    name: string;
    category: string | null;
    image_path: string;
    image_url: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface LinkProp {
    url: string | null;
    label: string;
    active: boolean;
}

interface StickerPaginator {
    data: Sticker[];
    links: LinkProp[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

interface Props {
    stickers: StickerPaginator;
    categories: string[];
    filters: {
        search?: string;
        category?: string;
        status?: string;
    };
}

export default function StickerIndex({ stickers, categories, filters }: Props) {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedSticker, setSelectedSticker] = useState<Sticker | null>(null);
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [categoryFilter, setCategoryFilter] = useState(filters.category || 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');

    const handleFilter = (key: string, value: string) => {
        const newFilters = {
            search: searchQuery,
            category: categoryFilter,
            status: statusFilter,
            [key]: value,
        };

        router.get(stickersRoute.index().url, newFilters, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilter('search', searchQuery);
    };
    const fileInputRef = useRef<HTMLInputElement>(null);
    const editFileInputRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: '',
        category: '',
        image: null as File | null,
        is_active: true,
        _method: 'POST', // Default for create
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('image', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const openCreateModal = () => {
        reset();
        clearErrors();
        setImagePreview(null);
        setIsCreateModalOpen(true);
    };

    const openEditModal = (sticker: Sticker) => {
        setSelectedSticker(sticker);
        setData({
            name: sticker.name,
            category: sticker.category || '',
            image: null,
            is_active: sticker.is_active,
            _method: 'PUT',
        });
        clearErrors();
        setImagePreview(sticker.image_url);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (sticker: Sticker) => {
        setSelectedSticker(sticker);
        setIsDeleteModalOpen(true);
    };

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        post(stickersRoute.store().url, {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                reset();
                toast.success('Sticker created successfully');
            },
        });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSticker) return;

        // Use post with _method: 'PUT' for multipart/form-data
        post(stickersRoute.update(selectedSticker.id).url, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                reset();
                toast.success('Sticker updated successfully');
            },
        });
    };

    const [isDeleting, setIsDeleting] = useState(false);
    const submitDelete = () => {
        if (!selectedSticker) return;
        setIsDeleting(true);
        router.delete(stickersRoute.destroy(selectedSticker.id).url, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setSelectedSticker(null);
                toast.success('Sticker deleted successfully');
            },
            onFinish: () => setIsDeleting(false),
        });
    };

    return (
        <>
            <Head title="Manage Stickers" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Stickers</h2>
                        <p className="text-muted-foreground">
                            Manage stickers for your photobooth templates.
                        </p>
                    </div>
                    <Button onClick={openCreateModal}>
                        <Plus className="mr-2 h-4 w-4" /> Add Sticker
                    </Button>
                </div>

                <div className="overflow-hidden rounded-xl border bg-card">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 border-b p-3 justify-between">
                        <form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search stickers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-sidebar h-9 pl-9 w-full shadow-none focus-visible:ring-1"
                            />
                        </form>
                        <div className="flex flex-wrap items-center gap-2">
                            {(filters.search || filters.category || filters.status) && (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setCategoryFilter('all');
                                        setStatusFilter('all');
                                        router.get(stickersRoute.index().url);
                                    }}
                                    className="h-9 px-3 text-xs"
                                >
                                    Reset Filters
                                </Button>
                            )}
                            <Select value={categoryFilter} onValueChange={(val) => {
                                setCategoryFilter(val);
                                handleFilter('category', val);
                            }}>
                                <SelectTrigger className="h-9 w-[150px] bg-sidebar shadow-none focus:ring-1">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
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
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 divide-x divide-y border-collapse">
                        {stickers.data.length === 0 ? (
                            <div className="col-span-full py-8 text-center">
                                No stickers found matching your search.
                            </div>

                        ) : (
                            stickers.data.map((sticker) => (
                                <div key={sticker.id} className="group relative aspect-square flex items-center justify-center p-4 hover:bg-muted/30 transition-colors border-r border-b">
                                    <img
                                        src={sticker.image_url}
                                        alt={sticker.name}
                                        className="max-h-full max-w-full object-contain transition-transform group-hover:scale-110"
                                    />

                                    {/* Hover Actions */}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="secondary" size="icon" className="h-8 w-8 shadow-md">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEditModal(sticker)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => openDeleteModal(sticker)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4 text-destructive" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* Name Badge on Hover */}
                                    <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <div className="bg-black/60 text-white text-[10px] px-2 py-1 rounded truncate text-center">
                                            {sticker.name}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="border-t bg-sidebar/50">
                        <Pagination links={stickers.links} className="py-3" />
                    </div>
                </div>
            </div>

            {/* Create Sticker Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent>
                    <form onSubmit={submitCreate}>
                        <DialogHeader>
                            <DialogTitle>Add Sticker</DialogTitle>
                            <DialogDescription>
                                Upload a new sticker for photobooth designs.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="flex flex-col items-center justify-center gap-4">
                                <div
                                    className="h-32 w-32 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {imagePreview ? (
                                        <img src={imagePreview} className="h-full w-full object-contain" />
                                    ) : (
                                        <div className="text-center p-4">
                                            <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground mb-1" />
                                            <p className="text-[0.7rem] text-muted-foreground">Click to upload</p>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                {errors.image && <p className="text-xs text-destructive">{errors.image}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g. Heart Sparkle"
                                />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="category">Category</Label>
                                <Input
                                    id="category"
                                    list="sticker-categories"
                                    value={data.category}
                                    onChange={(e) => setData('category', e.target.value)}
                                    placeholder="e.g. Wedding, Cute"
                                />
                                <datalist id="sticker-categories">
                                    {categories.map(cat => <option key={cat} value={cat} />)}
                                </datalist>
                                {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                    <Label htmlFor="is_active">Is Active</Label>
                                    <p className="text-[0.8rem] text-muted-foreground">Sticker will be visible in editor.</p>
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
                                Create Sticker
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Sticker Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <form onSubmit={submitEdit}>
                        <DialogHeader>
                            <DialogTitle>Edit Sticker</DialogTitle>
                            <DialogDescription>
                                Update sticker details or replace the image.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="flex flex-col items-center justify-center gap-4">
                                <div
                                    className="h-32 w-32 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors"
                                    onClick={() => editFileInputRef.current?.click()}
                                >
                                    {imagePreview ? (
                                        <img src={imagePreview} className="h-full w-full object-contain" />
                                    ) : (
                                        <div className="text-center p-4">
                                            <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground mb-1" />
                                            <p className="text-[0.7rem] text-muted-foreground">Click to upload</p>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    ref={editFileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <p className="text-[0.7rem] text-muted-foreground text-center">
                                    Leave empty to keep current image.
                                </p>
                                {errors.image && <p className="text-xs text-destructive">{errors.image}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">Name</Label>
                                <Input
                                    id="edit-name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-category">Category</Label>
                                <Input
                                    id="edit-category"
                                    list="edit-sticker-categories"
                                    value={data.category}
                                    onChange={(e) => setData('category', e.target.value)}
                                />
                                <datalist id="edit-sticker-categories">
                                    {categories.map(cat => <option key={cat} value={cat} />)}
                                </datalist>
                                {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                    <Label htmlFor="edit-is_active">Is Active</Label>
                                    <p className="text-[0.8rem] text-muted-foreground">Sticker will be visible in editor.</p>
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
                        <DialogTitle>Delete Sticker</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{selectedSticker?.name}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={submitDelete} disabled={isDeleting}>
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

StickerIndex.layout = {
    breadcrumbs: [
        {
            title: 'Stickers',
            href: stickersRoute.index().url,
        },
    ],
};
