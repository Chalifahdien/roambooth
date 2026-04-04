import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LinkProp {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    links: LinkProp[];
    className?: string;
}

export function Pagination({ links, className }: Props) {
    if (links.length <= 3) return null;

    return (
        <div className={cn("flex flex-wrap items-center justify-center gap-1 py-1 px-4", className)}>
            {links.map((link, key) => {
                const isPrev = link.label.includes('Previous');
                const isNext = link.label.includes('Next');
                
                let label = link.label;
                if (isPrev) label = '';
                if (isNext) label = '';

                if (link.url === null) {
                    return (
                        <Button
                            key={key}
                            variant="ghost"
                            size="sm"
                            disabled
                            className="h-8 w-8 p-0 opacity-50"
                        >
                            {isPrev ? <ChevronLeft className="h-4 w-4" /> : isNext ? <ChevronRight className="h-4 w-4" /> : label}
                        </Button>
                    );
                }

                return (
                    <Button
                        key={key}
                        variant={link.active ? "default" : "outline"}
                        size={ (isPrev || isNext) ? "icon" : "sm" }
                        asChild
                        className={cn(
                            "h-8",
                            (isPrev || isNext) ? "w-8" : "min-w-8 px-2 text-xs",
                            link.active ? "" : "bg-sidebar hover:bg-muted"
                        )}
                    >
                        <Link href={link.url} preserveScroll>
                            {isPrev ? <ChevronLeft className="h-4 w-4" /> : isNext ? <ChevronRight className="h-4 w-4" /> : label}
                        </Link>
                    </Button>
                );
            })}
        </div>
    );
}
