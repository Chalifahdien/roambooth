import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Image as ImageIcon, Loader2, UploadCloud } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import templatesRoute from '@/routes/templates';
import AppLayout from '@/layouts/app-layout';

interface PaperSize {
    id: number;
    name: string;
    width_mm: number;
    height_mm: number;
}

interface Props {
    existingCategories: string[];
    paperSizes: PaperSize[];
}

export default function TemplateCreate({ existingCategories, paperSizes }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        type: 'reguler',
        category: '',
        orientation: 'portrait',
        paper_size_id: '',
        template_path: null as File | null,
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setData('template_path', file);

        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        } else {
            setPreviewUrl(null);
        }
    };

    // Draw image to canvas when previewUrl changes
    useEffect(() => {
        if (!previewUrl || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            // Set canvas size to match image or some max dimensions while preserving aspect ratio
            const maxWidth = 800;
            const maxHeight = 600;
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = (maxWidth / width) * height;
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = (maxHeight / height) * width;
                height = maxHeight;
            }

            canvas.width = width;
            canvas.height = height;
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
        };
        img.src = previewUrl;

        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(templatesRoute.store().url);
    };

    return (
        <>
            <Head title="Create Template" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center gap-4 justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Create New Template</h2>
                        <p className="text-muted-foreground">
                            Upload a background image and set basic details.
                        </p>
                    </div>
                    <Button variant="outline" size="icon" asChild>
                        <Link href={templatesRoute.index().url}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 grid-cols-1 md:grid-cols-12">
                    <div className="space-y-6 md:col-span-5">
                        <form onSubmit={handleSubmit}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Template Details</CardTitle>
                                    <CardDescription>
                                        Basic configuration for your template.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Template Name</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="e.g. Minimalist Wedding"
                                            required
                                        />
                                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="paper_size_id">Paper Size</Label>
                                        <Select

                                            value={data.paper_size_id}
                                            onValueChange={(value) => setData('paper_size_id', value)}
                                        >
                                            <SelectTrigger id="paper_size_id" className="w-full">
                                                <SelectValue placeholder="Select paper size" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {paperSizes.map((size) => (
                                                    <SelectItem key={size.id} value={size.id.toString()}>
                                                        {size.name} ({size.width_mm}x{size.height_mm}mm)
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.paper_size_id && <p className="text-sm text-destructive">{errors.paper_size_id}</p>}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="category">Category</Label>
                                        <Input
                                            id="category"
                                            list="existing-categories"
                                            value={data.category}
                                            onChange={(e) => setData('category', e.target.value)}
                                            placeholder="e.g. Wedding, Birthday"
                                        />
                                        <datalist id="existing-categories">
                                            {existingCategories.map((category) => (
                                                <option key={category} value={category} />
                                            ))}
                                        </datalist>
                                        {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="type">Type</Label>
                                            <Select
                                                value={data.type}
                                                onValueChange={(value) => setData('type', value)}
                                            >
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
                                            <Label htmlFor="orientation">Orientation</Label>
                                            <Select
                                                value={data.orientation}
                                                onValueChange={(value) => setData('orientation', value as any)}
                                            >
                                                <SelectTrigger id="orientation" className="w-full">
                                                    <SelectValue placeholder="Select orientation" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="portrait">Portrait</SelectItem>
                                                    <SelectItem value="landscape">Landscape</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.orientation && <p className="text-sm text-destructive">{errors.orientation}</p>}
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="template_path">Template Image</Label>
                                        <Input
                                            id="template_path"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="cursor-pointer"
                                            required
                                        />
                                        <p className="text-[0.7rem] text-muted-foreground">PNG/JPG recommended. Proportions will be automatically calculated.</p>
                                        {errors.template_path && <p className="text-sm text-destructive">{errors.template_path}</p>}
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" disabled={processing}>
                                        {processing ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            'Create & Next'
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </form>
                    </div>
                    <div className="space-y-6 md:col-span-7">
                        <Card className="overflow-hidden bg-sidebar/50 border-dashed">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4" />
                                    Background Preview
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex items-center justify-center min-h-[400px] p-0 relative">
                                {previewUrl ? (
                                    <div className="p-4 w-full flex justify-center">
                                        <canvas
                                            ref={canvasRef}
                                            className="max-w-full h-auto rounded-lg shadow-lg border bg-white"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground p-12">
                                        <div className="p-4 rounded-full bg-sidebar">
                                            <UploadCloud className="h-10 w-10 opacity-20" />
                                        </div>
                                        <p>No image selected yet</p>
                                        <p className="text-xs">Preview will appear here once you upload a file.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

TemplateCreate.layout = {
    breadcrumbs: [
        {
            title: 'Templates',
            href: templatesRoute.index().url,
        },
        {
            title: 'Create',
            href: templatesRoute.create().url,
        },
    ],
};
