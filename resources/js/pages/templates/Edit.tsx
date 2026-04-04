import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import templatesRoute from '@/routes/templates';
import { Head, Link, useForm } from '@inertiajs/react';
import * as fabric from 'fabric';
import {
    ArrowLeft, Check, Copy, Circle, Square, Heart, Star, Triangle, Hexagon,
    MousePointer2, Pencil, Save, Trash2, ZoomIn, ZoomOut, RotateCcw, Loader2, Clipboard
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface Frame {
    id?: number;
    x: number;
    y: number;
    width: number;
    height: number;
    angle: number;
    shape: string;
    path_data?: string | null;
}

interface PaperSize {
    id: number;
    name: string;
    width_mm: number;
    height_mm: number;
}

interface Template {
    id: number;
    name: string;
    category: string | null;
    template_path: string;
    image_width: number;
    image_height: number;
    orientation: 'portrait' | 'landscape';
    type: string;
    paper_size_id: number;
    frames: Frame[];
}

interface Props {
    template: Template;
    existingCategories: string[];
    paperSizes: PaperSize[];
}

// Shape configurations (SVG Paths)
const SHAPE_PATHS: Record<string, string> = {
    'heart': 'M 272.70141,238.71731 C 206.46141,238.71731 152.70141,292.47731 152.70141,358.71731 C 152.70141,493.46212 288.63461,521.28716 396.70141,617.91731 C 504.76821,521.28716 640.70141,493.46212 640.70141,358.71731 C 640.70141,292.47731 586.94141,238.71731 520.70141,238.71731 C 492.39938,238.71731 466.31524,248.61263 445.70141,265.18606 L 396.70141,304.59231 L 347.70141,265.18606 C 327.08758,248.61263 301.00344,238.71731 272.70141,238.71731 z',
    'star': 'M 302.34863,165.7196 L 329.58983,235.15064 L 401.76993,238.82582 L 345.52989,286.06822 L 364.5779,356.36872 L 302.34863,316.58628 L 240.11936,356.36872 L 259.16736,286.06822 L 202.92733,238.82582 L 275.10743,235.15064 L 302.34863,165.7196 z',
    'triangle': 'M 363.5,224.5 L 467,411.5 L 260,411.5 z',
    'hexagon': 'M 353.5,236.5 L 420,275 L 420,352 L 353.5,390.5 L 287,352 L 287,275 z'
};

const COMMON_STYLES = {
    fill: 'rgba(40, 167, 69, 0.15)',
    stroke: '#1e4620',
    strokeWidth: 4,
    strokeDashArray: [10, 10],
    strokeUniform: true,
    originX: 'center' as const,
    originY: 'center' as const,
    centeredRotation: true,
    transparentCorners: false,
    cornerColor: '#28a745',
    borderColor: '#28a745',
    cornerSize: 12,
};

export default function TemplateEdit({ template, existingCategories, paperSizes }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const fabricCanvas = useRef<fabric.Canvas | null>(null);
    const clipboard = useRef<fabric.FabricObject | null>(null);

    // Zoom states: visual relative zoom (1.0 = 100%) and calculated baseline
    const [zoom, setZoom] = useState(1);
    const [baselineZoom, setBaselineZoom] = useState(1);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawingPoints, setDrawingPoints] = useState<{ x: number, y: number }[]>([]);
    const [tempObjects, setTempObjects] = useState<fabric.FabricObject[]>([]);

    const { data, setData, put, processing, errors } = useForm<{
        name: string;
        category: string;
        paper_size_id: string;
        type: string;
        orientation: string;
        frames: string;
    }>({
        name: template.name,
        category: template.category || '',
        paper_size_id: template.paper_size_id?.toString() || '',
        type: template.type || 'reguler',
        orientation: template.orientation || 'portrait',
        frames: '',
    });

    // Initialize Canvas
    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        let disposed = false;

        const canvas = new fabric.Canvas(canvasRef.current, {
            preserveObjectStacking: true,
        });

        fabricCanvas.current = canvas;

        const imageUrl = `/storage/${template.template_path}`;

        fabric.FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' }).then((img) => {
            if (disposed) return; // Canvas already cleaned up

            const scaleX = template.image_width / img.width;
            const scaleY = template.image_height / img.height;

            img.set({
                scaleX: scaleX,
                scaleY: scaleY,
                selectable: false,
                evented: false,
                originX: 'left',
                originY: 'top',
                left: 0,
                top: 0
            });

            canvas.backgroundImage = img;

            // Calculate baseline zoom to fit container width perfectly
            const containerWidth = containerRef.current?.offsetWidth || 900;
            const base = containerWidth / template.image_width;
            setBaselineZoom(base);
            setZoom(1); // Start at 100% relative to fit-width

            canvas.setZoom(base);
            canvas.setDimensions({
                width: template.image_width * base,
                height: template.image_height * base,
            });

            loadExistingFrames(canvas);
            canvas.renderAll();
        }).catch(err => {
            if (disposed) return;
            console.error('Error loading background image:', err, 'URL:', imageUrl);
            toast.error('Failed to load template background image');
        });

        return () => {
            disposed = true;
            canvas.dispose();
        };
    }, []);

    const loadExistingFrames = (canvas: fabric.Canvas) => {
        if (!template.frames) return;

        template.frames.forEach((frame: Frame) => {
            let shapeObj: fabric.FabricObject;

            const baseOptions = {
                ...COMMON_STYLES,
                left: frame.x + frame.width / 2,
                top: frame.y + frame.height / 2,
                angle: frame.angle,
            };

            if (frame.shape === 'rect' || frame.shape === 'rectangle') {
                shapeObj = new fabric.Rect({
                    ...baseOptions,
                    width: frame.width,
                    height: frame.height,
                });
            } else if (frame.shape === 'circle') {
                shapeObj = new fabric.Ellipse({
                    ...baseOptions,
                    rx: frame.width / 2,
                    ry: frame.height / 2,
                });
            } else if (frame.shape === 'custom' && frame.path_data) {
                const points = JSON.parse(frame.path_data);
                shapeObj = new fabric.Polygon(points, {
                    ...baseOptions,
                });
                // Sesuaikan skala agar ukuran visual pas dengan frame.width & frame.height
                // Karena Polygon menghitung width/height dari points, kita perlu scaling jika user me-resize
                const origW = shapeObj.width || 1;
                const origH = shapeObj.height || 1;
                shapeObj.set({
                    scaleX: frame.width / origW,
                    scaleY: frame.height / origH,
                });
            } else {
                const path = SHAPE_PATHS[frame.shape] || SHAPE_PATHS['rect'];
                const p = new fabric.Path(path);
                shapeObj = new fabric.Path(path, {
                    ...baseOptions,
                    scaleX: frame.width / (p.width || 1),
                    scaleY: frame.height / (p.height || 1),
                });
            }

            (shapeObj as any).data = { shape: frame.shape, path_data: frame.path_data };
            canvas.add(shapeObj);
        });
        canvas.renderAll();
    };

    const addShape = (type: string) => {
        if (!fabricCanvas.current) return;
        const canvas = fabricCanvas.current;
        const container = containerRef.current;

        // Hitung titik tengah dari area yang sedang terlihat di layar
        let centerX = template.image_width / 2;
        let centerY = template.image_height / 2;

        if (container) {
            const totalZoom = canvas.getZoom();
            const scrollLeft = container.scrollLeft;
            const scrollTop = container.scrollTop;
            const visibleWidth = container.clientWidth;
            const visibleHeight = container.clientHeight;

            // Konversi titik tengah layar ke koordinat kanvas asli
            centerX = (scrollLeft + visibleWidth / 2) / totalZoom;
            centerY = (scrollTop + visibleHeight / 2) / totalZoom;

            // Pastikan shape tidak keluar dari batas template
            centerX = Math.max(50, Math.min(centerX, template.image_width - 50));
            centerY = Math.max(50, Math.min(centerY, template.image_height - 50));
        }

        let shapeObj: fabric.FabricObject;
        const baseOptions = {
            ...COMMON_STYLES,
            left: centerX,
            top: centerY,
        };

        if (type === 'rect') {
            shapeObj = new fabric.Rect({
                ...baseOptions,
                width: 200,
                height: 150,
            });
        } else if (type === 'circle') {
            shapeObj = new fabric.Ellipse({
                ...baseOptions,
                rx: 100,
                ry: 100,
            });
        } else {
            const path = SHAPE_PATHS[type];
            const p = new fabric.Path(path);
            const targetSize = 200;
            const s = targetSize / Math.max(p.width, p.height);
            shapeObj = new fabric.Path(path, {
                ...baseOptions,
                scaleX: s,
                scaleY: s,
            });
        }

        (shapeObj as any).data = { shape: type };
        canvas.add(shapeObj);
        canvas.setActiveObject(shapeObj);
        canvas.renderAll();
    };

    const toggleDrawingMode = () => {
        const canvas = fabricCanvas.current;
        if (!canvas) return;

        if (isDrawing) {
            resetDrawing();
        } else {
            setIsDrawing(true);
            canvas.discardActiveObject();
            canvas.selection = false;
            canvas.forEachObject(o => (o.selectable = false));
            canvas.defaultCursor = 'crosshair';
            canvas.on('mouse:down', handleCanvasClick);
        }
    };

    const handleCanvasClick = (opt: any) => {
        const canvas = fabricCanvas.current;
        if (!canvas) return;

        const pointer = canvas.getScenePoint(opt.e);
        const newPoint = { x: pointer.x, y: pointer.y };

        setDrawingPoints(prev => {
            const next = [...prev, newPoint];
            const circle = new fabric.Circle({
                radius: 4 / canvas.getZoom(), fill: 'blue', left: newPoint.x, top: newPoint.y,
                originX: 'center', originY: 'center', selectable: false, evented: false
            });
            canvas.add(circle);
            setTempObjects(old => [...old, circle]);

            if (next.length > 1) {
                const prevPt = next[next.length - 2];
                const line = new fabric.Line([prevPt.x, prevPt.y, newPoint.x, newPoint.y], {
                    stroke: 'blue', strokeWidth: 2 / canvas.getZoom(), selectable: false, evented: false
                });
                canvas.add(line);
                setTempObjects(old => [...old, line]);
            }
            return next;
        });
    };

    const finishDrawing = () => {
        const canvas = fabricCanvas.current;
        if (!canvas || drawingPoints.length < 3) {
            toast.error('At least 3 points are required');
            return;
        }

        const poly = new fabric.Polygon(drawingPoints, {
            ...COMMON_STYLES,
        });

        (poly as any).data = {
            shape: 'custom',
            path_data: JSON.stringify(drawingPoints)
        };

        canvas.add(poly);
        resetDrawing();
        canvas.setActiveObject(poly);
    };

    const resetDrawing = () => {
        const canvas = fabricCanvas.current;
        if (!canvas) return;
        canvas.off('mouse:down');
        tempObjects.forEach(o => canvas.remove(o));
        setTempObjects([]);
        setDrawingPoints([]);
        setIsDrawing(false);
        canvas.selection = true;
        canvas.forEachObject(o => (o.selectable = true));
        canvas.defaultCursor = 'default';
        canvas.renderAll();
    };

    const handleZoom = (val: number) => {
        const canvas = fabricCanvas.current;
        if (!canvas) return;

        const newZoom = zoom + val;
        if (newZoom > 5) return;
        if (newZoom < 0.1) return;

        const absoluteZoom = newZoom * baselineZoom;

        setZoom(newZoom);
        canvas.setZoom(absoluteZoom);
        canvas.setDimensions({
            width: template.image_width * absoluteZoom,
            height: template.image_height * absoluteZoom,
        });
    };

    const resetZoom = () => {
        const canvas = fabricCanvas.current;
        if (!canvas || !containerRef.current) return;

        const containerWidth = containerRef.current.offsetWidth;
        const base = containerWidth / template.image_width;

        setBaselineZoom(base);
        setZoom(1);
        canvas.setZoom(base);
        canvas.setDimensions({
            width: template.image_width * base,
            height: template.image_height * base,
        });
    };

    const deleteSelected = () => {
        const canvas = fabricCanvas.current;
        if (!canvas) return;
        const active = canvas.getActiveObjects();
        if (active.length > 0) {
            active.forEach(o => canvas.remove(o));
            canvas.discardActiveObject();
            canvas.renderAll();
        }
    };

    const copyObject = () => {
        const canvas = fabricCanvas.current;
        if (!canvas) return;
        const active = canvas.getActiveObject();
        if (active) {
            const dataToCopy = (active as any).data;
            active.clone().then((cloned: fabric.FabricObject) => {
                if (dataToCopy) {
                    (cloned as any).data = { ...dataToCopy };
                }
                clipboard.current = cloned;
                toast.success('Object copied');
            });
        }
    };

    const pasteObject = () => {
        const canvas = fabricCanvas.current;
        if (!canvas || !clipboard.current) return;

        const dataToPaste = (clipboard.current as any).data;
        clipboard.current.clone().then((cloned: fabric.FabricObject) => {
            canvas.discardActiveObject();
            cloned.set({
                left: (cloned.left || 0) + 20,
                top: (cloned.top || 0) + 20,
                evented: true,
            });
            if (dataToPaste) {
                (cloned as any).data = { ...dataToPaste };
            }
            canvas.add(cloned);
            cloned.setCoords();
            canvas.setActiveObject(cloned);
            canvas.requestRenderAll();
        });
    };

    const handleSave = () => {
        const canvas = fabricCanvas.current;
        if (!canvas) return;

        console.log("ALL OBJECTS TO SAVE:", canvas.getObjects().map(o => ({ obj: o, data: (o as any).data })));

        const framesData = canvas.getObjects().filter(o => (o as any).data).map(o => {
            const w = o.width! * o.scaleX!;
            const h = o.height! * o.scaleY!;

            return {
                x: Math.round(o.left! - w / 2),
                y: Math.round(o.top! - h / 2),
                width: Math.round(w),
                height: Math.round(h),
                angle: Math.round(o.angle || 0),
                shape: (o as any).data?.shape || 'rect',
                path_data: (o as any).data?.path_data || null,
            };
        });

        if (framesData.length === 0) {
            toast.error('At least one frame is required');
            return;
        }

        setData('frames', JSON.stringify(framesData));
    };

    useEffect(() => {
        if (data.frames && data.frames !== '') {
            put(templatesRoute.update(template.id).url, {
                onSuccess: () => {
                    toast.success('Template updated successfully');
                    setData('frames', '');
                },
            });
        }
    }, [data.frames]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

            if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                e.preventDefault(); copyObject();
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                e.preventDefault(); pasteObject();
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                deleteSelected();
            }
        };

        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, []);

    return (
        <>
            <Head title={`Edit Template - ${template.name}`} />

            <div className="flex h-full flex-col gap-4 p-4">
                {/* <div className="flex items-center "> */}
                <div className="flex items-center gap-4 justify-between">

                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Template Editor</h2>
                        <p className="text-muted-foreground">
                            Designing <strong>{template.name}</strong>
                        </p>
                    </div>
                    <Button variant="outline" size="icon" asChild>
                        <Link href={templatesRoute.index().url}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
                {/* <div className="flex gap-2">
                        <Button onClick={handleSave} disabled={processing}>
                            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Design
                        </Button>
                    </div> */}
                {/* </div> */}

                <div className="grid gap-4 grid-cols-1 lg:grid-cols-12">
                    {/* Toolbar */}
                    <div className='space-y-6 lg:col-span-5'>
                        <Card className="mb-5 gap-0 py-0">
                            <CardHeader className='pt-6'>
                                <CardTitle>Information</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-auto pb-6">
                                <div className="pt-4 grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Template Name</Label>
                                        <Input id="name" value={data.name} onChange={e => setData('name', e.target.value)} placeholder="e.g. Minimalist Wedding" required />
                                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="paper_size_id">Paper Size</Label>
                                        <Select value={data.paper_size_id} onValueChange={(value) => setData('paper_size_id', value)}>
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
                                        <Input id="category" list="categories" value={data.category} onChange={e => setData('category', e.target.value)} placeholder="e.g. Wedding, Birthday" />
                                        <datalist id="categories">
                                            {existingCategories.map((c: string) => <option key={c} value={c} />)}
                                        </datalist>
                                        {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="type">Type</Label>
                                            <Select value={data.type} onValueChange={(value) => setData('type', value)}>
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
                                            <Select value={data.orientation} onValueChange={(value) => setData('orientation', value)}>
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
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="gap-0 py-0">
                            <CardHeader className='pt-6'>
                                <CardTitle>Tools & Properties</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-auto space-y-6 pb-6">
                                {/* Shapes Section */}
                                <div className="pt-4 space-y-3">
                                    <Label>Add Shapes</Label>
                                    <div className="flex flex-wrap gap-2">
                                        <Button variant="outline" size="icon" onClick={() => addShape('rect')} title="Rectangle">
                                            <Square className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="icon" onClick={() => addShape('circle')} title="Circle">
                                            <Circle className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="icon" onClick={() => addShape('heart')} title="Heart">
                                            <Heart className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="icon" onClick={() => addShape('star')} title="Star">
                                            <Star className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="icon" onClick={() => addShape('triangle')} title="Triangle">
                                            <Triangle className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="icon" onClick={() => addShape('hexagon')} title="Hexagon">
                                            <Hexagon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Button
                                        className="w-full justify-center mt-2"
                                        variant={isDrawing ? "default" : "outline"}
                                        onClick={toggleDrawingMode}
                                    >
                                        <Pencil className="mr-2 h-4 w-4" />
                                        {isDrawing ? "Cancel Drawing" : "Draw Custom Frame"}
                                    </Button>
                                    {isDrawing && (
                                        <Button className="w-full" variant="default" onClick={finishDrawing}>
                                            <Check className="mr-2 h-4 w-4" /> Finish Shape
                                        </Button>
                                    )}
                                </div>

                                {/* Canvas Actions */}
                                <div className="space-y-3">
                                    <Label>Actions</Label>
                                    <div className="flex flex-wrap gap-2">
                                        <Button variant="outline" size="icon" onClick={() => handleZoom(-0.1)}>
                                            <ZoomOut className="h-4 w-4" />
                                        </Button>
                                        <div className="flex-1 text-center font-mono text-sm border rounded-md h-9 flex items-center justify-center bg-muted/30">
                                            {Math.round(zoom * 100)}%
                                        </div>
                                        <Button variant="outline" size="icon" onClick={() => handleZoom(0.1)}>
                                            <ZoomIn className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="icon" onClick={resetZoom} title="Reset Zoom">
                                            <RotateCcw className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="icon" onClick={copyObject} title="Copy Object">
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="icon" onClick={pasteObject} title="Paste Object">
                                            <Clipboard className="h-4 w-4 scale-x-[-1]" />
                                        </Button>
                                        <Button variant="outline" size="icon" onClick={deleteSelected} className="text-destructive hover:bg-destructive/10" title="Delete Selected">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    {/* Canvas Area */}
                    <div className='space-y-6 lg:col-span-7'>
                        <Card className="bg-sidebar/10 gap-0 py-0">
                            <CardHeader className="py-4 px-4 bg-sidebar rounded-t-xl border-b flex flex-row items-center justify-between mb-0">
                                <CardTitle className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                                    <MousePointer2 className="h-3 w-3" />
                                    Interactive Canvas Editor
                                </CardTitle>
                                {/* <Badge variant="outline" className="text-[10px]">
                                    {template.image_width} x {template.image_height} PX
                                </Badge> */}
                                <Button onClick={handleSave} disabled={processing}>
                                    {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Design
                                </Button>
                            </CardHeader>
                            <CardContent ref={containerRef} className="overflow-auto bg-grid-white/[0.02] p-0 m-2 rounded-sm max-h-[70vh]">
                                <div className="flex items-center justify-center min-w-full min-h-full w-fit">
                                    <canvas ref={canvasRef} />
                                </div>
                            </CardContent>
                            {isDrawing && (
                                <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold animate-pulse z-50">
                                    Drawing Mode: Click points. Use "Finish Shape" to save.
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div >

            <style dangerouslySetInnerHTML={{
                __html: `
                .bg-sidebar\\/10 {
                    background-image: 
                        linear-gradient(45deg, rgba(0,0,0,0.02) 25%, transparent 25%), 
                        linear-gradient(-45deg, rgba(0,0,0,0.02) 25%, transparent 25%), 
                        linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.02) 75%), 
                        linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.02) 75%);
                    background-size: 20px 20px;
                    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
                }
            `}} />
        </>
    );
}

TemplateEdit.layout = {
    breadcrumbs: [
        { title: 'Templates', href: templatesRoute.index().url },
        { title: 'Editor', href: '#' },
    ],
};

