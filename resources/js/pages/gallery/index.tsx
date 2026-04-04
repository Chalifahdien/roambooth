import { Head, router } from '@inertiajs/react';
import { Search, Eye, Download, ExternalLink, Calendar, Monitor, ReceiptText } from 'lucide-react';
import { useState } from 'react';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import galleryRoute from '@/routes/gallery';

const formatDate = (date: string | null) => {
    if (!date) return '-';
    try {
        return new Intl.DateTimeFormat('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(date));
    } catch (e) {
        return '-';
    }
};

interface FinalImage {
    id: number;
    transaction_id: number;
    image_path: string;
    video_path: string | null;
    image_url: string;
    video_url: string | null;
    created_at: string;
    transaction: {
        transaction_id: string; // The machine-generated ID
        machine: {
            name: string;
        };
        template: {
            name: string;
        };
    };
}

interface LinkProp {
    url: string | null;
    label: string;
    active: boolean;
}

interface GalleryPaginator {
    data: FinalImage[];
    links: LinkProp[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

interface Props {
    gallery: GalleryPaginator;
    filters: {
        search?: string;
    };
}

export default function GalleryIndex({ gallery, filters }: Props) {
    const [selectedImage, setSelectedImage] = useState<FinalImage | null>(null);
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(galleryRoute.index({ query: { search: searchQuery } }).url, {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const downloadImage = (url: string, filename: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.appendChild(link);
    };

    return (
        <>
            <Head title="Gallery" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Gallery</h2>
                        <p className="text-muted-foreground">
                            Browse and manage photobooth results.
                        </p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border bg-card">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 border-b p-3 justify-between">
                        <form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by Transaction ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-sidebar h-9 pl-9 w-full shadow-none focus-visible:ring-1"
                            />
                        </form>
                        <div className="flex flex-wrap items-center gap-2">
                            {filters.search && (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setSearchQuery('');
                                        router.get(galleryRoute.index().url);
                                    }}
                                    className="h-9 px-3 text-xs"
                                >
                                    Reset
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 divide-x divide-y border-collapse">
                        {gallery.data.length === 0 ? (
                            <div className="col-span-full pb-6 pt-6 text-center">
                                <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/30" />
                                <h3 className="text-lg font-medium">No results found</h3>
                                <p className="text-sm text-muted-foreground">Try adjusting your search filters.</p>
                            </div>
                        ) : (
                            gallery.data.map((item) => (
                                <div
                                    key={item.id}
                                    className="group relative aspect-3/4 flex items-center justify-center p-4 hover:bg-muted/30 transition-colors border-r border-b"
                                >
                                    <img
                                        src={item.image_url}
                                        alt={item.transaction.transaction_id}
                                        className="max-h-full max-w-full object-contain transition-transform group-hover:scale-110"
                                    />

                                    {/* Hover Actions */}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="h-8 w-8 shadow-md"
                                            onClick={() => setSelectedImage(item)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="h-8 w-8 shadow-md"
                                            onClick={() => downloadImage(item.image_url, `result-${item.transaction.transaction_id}.png`)}
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* Info Badge on Hover */}
                                    <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <div className="bg-black/60 text-white text-[10px] px-2 py-1 rounded text-center flex flex-col">
                                            <span className="truncate">{item.transaction.transaction_id}</span>
                                            <span className="opacity-80 border-t border-white/20 mt-1 pt-0.5">{formatDate(item.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="border-t bg-sidebar/50">
                        <Pagination links={gallery.links} className="py-3" />
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none sm:rounded-none">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Image Preview</DialogTitle>
                    </DialogHeader>
                    {selectedImage && (
                        <div className="relative flex flex-col md:flex-row bg-background rounded-xl overflow-hidden shadow-2xl h-[90vh] md:h-auto max-h-[90vh]">
                            <div className="flex-1 bg-black/5 flex items-center justify-center p-4 min-h-0">
                                <img
                                    src={selectedImage.image_url}
                                    className="max-h-full max-w-full object-contain shadow-md rounded-sm"
                                    alt="Result"
                                />
                            </div>
                            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l p-6 shrink-0 bg-muted/10 backdrop-blur-sm overflow-y-auto">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <ReceiptText className="h-5 w-5 text-primary" />
                                    Transaction Info
                                </h3>

                                <div className="space-y-6">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest px-1">Internal ID</Label>
                                        <div className="bg-card border rounded-lg p-3 font-mono text-sm shadow-sm select-all">
                                            {selectedImage.transaction.transaction_id}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="flex items-start gap-3 bg-card border rounded-lg p-3 shadow-sm">
                                            <Monitor className="h-4 w-4 mt-0.5 text-blue-500" />
                                            <div>
                                                <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">Machine</p>
                                                <p className="text-sm font-semibold">{selectedImage.transaction.machine.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 bg-card border rounded-lg p-3 shadow-sm">
                                            <ImageIcon className="h-4 w-4 mt-0.5 text-purple-500" />
                                            <div>
                                                <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">Template</p>
                                                <p className="text-sm font-semibold">{selectedImage.transaction.template.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 bg-card border rounded-lg p-3 shadow-sm">
                                            <Calendar className="h-4 w-4 mt-0.5 text-orange-500" />
                                            <div>
                                                <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">Date Taken</p>
                                                <p className="text-sm font-semibold">{formatDate(selectedImage.created_at)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex flex-col gap-2">
                                        <Button
                                            className="w-full shadow-md"
                                            onClick={() => downloadImage(selectedImage.image_url, `result-${selectedImage.transaction.transaction_id}.png`)}
                                        >
                                            <Download className="mr-2 h-4 w-4" /> Download Result
                                        </Button>
                                        {selectedImage.video_url && (
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                                onClick={() => selectedImage.video_url && window.open(selectedImage.video_url, '_blank')}
                                            >
                                                <ExternalLink className="mr-2 h-4 w-4" /> View Video
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

GalleryIndex.layout = (page: any) => (
    <AppLayout children={page} />
);

// This is if we use the default layout without pre-defined breadcrumbs in controller, 
// but since I don't see GuestLayout usage here, I'll stick to AppLayout.
// Wait, I need to check where AppLayout is.
import AppLayout from '@/layouts/app-layout';
import { Image as ImageIcon } from 'lucide-react';

GalleryIndex.layout = (page: any) => (
    <AppLayout
        children={page}
        breadcrumbs={[
            {
                title: 'Gallery',
                href: galleryRoute.index().url,
            },
        ]}
    />
);
