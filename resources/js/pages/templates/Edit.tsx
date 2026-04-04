import { Head, Link, useForm, router } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2, Save, Move, Maximize, Layers, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import templatesRoute from '@/routes/templates';
import AppLayout from '@/layouts/app-layout';
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

interface Template {
    id: number;
    name: string;
    category: string | null;
    template_path: string;
    image_width: number;
    image_height: number;
    orientation: 'portrait' | 'landscape';
    frames: Frame[];
}

interface Props {
    template: Template;
    existingCategories: string[];
}

export default function TemplateEdit({ template, existingCategories }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [frames, setFrames] = useState<Frame[]>(template.frames || []);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [scale, setScale] = useState(1);

    const { data, setData, put, processing, errors } = useForm({
        name: template.name,
        category: template.category || '',
        frames: JSON.stringify(template.frames || []),
    });

    // Update scale when container or image changes
    useEffect(() => {
        const updateScale = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.offsetWidth;
                setScale(containerWidth / template.image_width);
            }
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, [template.image_width]);

    // Keep form data in sync with frames state
    useEffect(() => {
        setData('frames', JSON.stringify(frames));
    }, [frames]);

    const addFrame = () => {
        const newFrame: Frame = {
            x: Math.round(template.image_width / 4),
            y: Math.round(template.image_height / 4),
            width: 400,
            height: 600,
            angle: 0,
            shape: 'rectangle',
        };
        setFrames([...frames, newFrame]);
        setSelectedIndex(frames.length);
    };

    const removeFrame = (index: number) => {
        const newFrames = [...frames];
        newFrames.splice(index, 1);
        setFrames(newFrames);
        setSelectedIndex(null);
    };

    const updateFrame = (index: number, updates: Partial<Frame>) => {
        const newFrames = [...frames];
        newFrames[index] = { ...newFrames[index], ...updates };
        setFrames(newFrames);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(templatesRoute.update(template.id).url, {
            onSuccess: () => toast.success('Template saved successfully!'),
        });
    };

    return (
        <>
            <Head title={`Edit Template - ${template.name}`} />

            <div className="flex flex-col gap-6 p-6 h-full">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href={templatesRoute.index().url}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Edit Template</h2>
                            <p className="text-muted-foreground">
                                Configure photo slots for <strong>{template.name}</strong>.
                            </p>
                        </div>
                    </div>
                    <Button onClick={handleSubmit} disabled={processing}>
                        {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Template
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_350px] flex-1 min-h-0">
                    {/* Visual Editor */}
                    <Card className="flex flex-col overflow-hidden bg-sidebar/30 border-dashed">
                        <CardHeader className="py-3 bg-muted/50 border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium">Visual Frame Editor</CardTitle>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="font-mono text-[10px]">
                                        {template.image_width} x {template.image_height}
                                    </Badge>
                                    <Button size="xs" variant="secondary" onClick={addFrame}>
                                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Frame
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-4 overflow-auto flex justify-center items-start bg-grid-white/[0.02]">
                            <div 
                                ref={containerRef}
                                className="relative shadow-2xl border"
                                style={{ 
                                    width: '100%', 
                                    maxWidth: template.image_width * scale,
                                    aspectRatio: `${template.image_width} / ${template.image_height}`,
                                    backgroundImage: `url(/storage/${template.template_path})`,
                                    backgroundSize: 'contain',
                                    backgroundRepeat: 'no-repeat'
                                }}
                            >
                                {frames.map((frame, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setSelectedIndex(i)}
                                        className={`absolute border-2 cursor-pointer transition-all ${
                                            selectedIndex === i 
                                                ? 'border-primary ring-2 ring-primary/20 bg-primary/10 z-20' 
                                                : 'border-white/50 bg-white/5 z-10 hover:border-white hover:bg-white/10'
                                        }`}
                                        style={{
                                            left: frame.x * scale,
                                            top: frame.y * scale,
                                            width: frame.width * scale,
                                            height: frame.height * scale,
                                            transform: `rotate(${frame.angle}deg)`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <div className="bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                            #{i + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Properties Panel */}
                    <div className="flex flex-col gap-4 overflow-auto min-h-0">
                        <Card>
                            <CardHeader className="py-4">
                                <CardTitle className="text-sm">Template Properties</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-3">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="name" className="text-xs">Name</Label>
                                    <Input 
                                        id="name" 
                                        size="sm" 
                                        value={data.name} 
                                        onChange={e => setData('name', e.target.value)} 
                                    />
                                    {errors.name && <p className="text-[10px] text-destructive">{errors.name}</p>}
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="category" className="text-xs">Category</Label>
                                    <Input 
                                        id="category" 
                                        size="sm" 
                                        list="existing-categories"
                                        value={data.category} 
                                        onChange={e => setData('category', e.target.value)} 
                                    />
                                    <datalist id="existing-categories">
                                        {existingCategories.map(cat => (
                                            <option key={cat} value={cat} />
                                        ))}
                                    </datalist>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="flex-1 flex flex-col min-h-0">
                            <CardHeader className="py-3 bg-muted/30 border-b">
                                <CardTitle className="text-sm flex items-center justify-between">
                                    Frame Settings
                                    {selectedIndex !== null && (
                                        <Badge variant="secondary">Frame #{selectedIndex + 1}</Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 overflow-auto">
                                {selectedIndex !== null ? (
                                    <div className="grid gap-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="grid gap-1.5">
                                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">X Position</Label>
                                                <Input 
                                                    type="number" 
                                                    size="sm" 
                                                    value={frames[selectedIndex].x} 
                                                    onChange={e => updateFrame(selectedIndex, { x: parseInt(e.target.value) || 0 })} 
                                                />
                                            </div>
                                            <div className="grid gap-1.5">
                                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Y Position</Label>
                                                <Input 
                                                    type="number" 
                                                    size="sm" 
                                                    value={frames[selectedIndex].y} 
                                                    onChange={e => updateFrame(selectedIndex, { y: parseInt(e.target.value) || 0 })} 
                                                />
                                            </div>
                                            <div className="grid gap-1.5">
                                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Width</Label>
                                                <Input 
                                                    type="number" 
                                                    size="sm" 
                                                    value={frames[selectedIndex].width} 
                                                    onChange={e => updateFrame(selectedIndex, { width: parseInt(e.target.value) || 0 })} 
                                                />
                                            </div>
                                            <div className="grid gap-1.5">
                                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Height</Label>
                                                <Input 
                                                    type="number" 
                                                    size="sm" 
                                                    value={frames[selectedIndex].height} 
                                                    onChange={e => updateFrame(selectedIndex, { height: parseInt(e.target.value) || 0 })} 
                                                />
                                            </div>
                                            <div className="grid gap-1.5">
                                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Rotation (Deg)</Label>
                                                <Input 
                                                    type="number" 
                                                    size="sm" 
                                                    value={frames[selectedIndex].angle} 
                                                    onChange={e => updateFrame(selectedIndex, { angle: parseInt(e.target.value) || 0 })} 
                                                />
                                            </div>
                                            <div className="grid gap-1.5">
                                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Shape</Label>
                                                <select 
                                                    className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm"
                                                    value={frames[selectedIndex].shape}
                                                    onChange={e => updateFrame(selectedIndex, { shape: e.target.value })}
                                                >
                                                    <option value="rectangle">Rectangle</option>
                                                    <option value="circle">Circle</option>
                                                    <option value="polygon">Polygon</option>
                                                </select>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="destructive" 
                                            size="sm" 
                                            className="w-full mt-2"
                                            onClick={() => removeFrame(selectedIndex)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" /> Delete Frame
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center gap-2 text-muted-foreground">
                                        <div className="p-3 bg-muted rounded-full">
                                            <Move className="h-6 w-6 opacity-40" />
                                        </div>
                                        <p className="text-xs">No frame selected.</p>
                                        <p className="text-[10px]">Click a frame on the canvas or add a new one.</p>
                                        <Button size="xs" variant="outline" className="mt-2" onClick={addFrame}>
                                            <Plus className="h-3 w-3 mr-1" /> Add First Frame
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="py-3 border-t bg-muted/10 text-[10px] text-muted-foreground flex justify-between">
                                <span>Total Frames: {frames.length}</span>
                                <span>{template.orientation}</span>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

TemplateEdit.layout = {
    breadcrumbs: [
        {
            title: 'Templates',
            href: templatesRoute.index().url,
        },
        {
            title: 'Edit',
            href: '#',
        },
    ],
};
