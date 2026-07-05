'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../../lib/utils';

const Tabs = TabsPrimitive.Root;

const TabsList = ({ className, ...props }) => (
    <TabsPrimitive.List
        className={cn(
            'inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-sm font-medium',
            className
        )}
        {...props}
    />
);

const TabsTrigger = ({ className, ...props }) => (
    <TabsPrimitive.Trigger
        className={cn(
            'inline-flex items-center justify-center rounded-md px-4 py-1.5 text-sm font-medium transition-colors data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
            className
        )}
        {...props}
    />
);

const TabsContent = ({ className, ...props }) => (
    <TabsPrimitive.Content
        className={cn(
            'mt-2 border border-input bg-background',
            className
        )}
        {...props}
    />
);

export { Tabs, TabsList, TabsTrigger, TabsContent };
