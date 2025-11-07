// components/dashboard/RecentActivityTimeline.js
"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, formatDistanceToNow } from "date-fns";
import { CheckCircle, Truck, Package, AlertTriangle } from "lucide-react";

// Helper to choose an icon based on status text
const getIconForStatus = (status) => {
    const s = status.toLowerCase();
    if (s.includes("delivered")) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (s.includes("out for delivery")) return <Truck className="w-5 h-5 text-blue-500" />;
    if (s.includes("delay") || s.includes("exception") || s.includes("unsuccessful")) return <AlertTriangle className="w-5 h-5 text-red-500" />;
    return <Package className="w-5 h-5 text-slate-500" />;
};

export default function RecentActivityTimeline({ updates, isLoading }) {
    return (
        <Card className="dark:bg-slate-900">
            <CardHeader>
                <CardTitle className="text-base font-semibold">Latest Updates</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6 h-[400px] overflow-y-auto pr-3">
                    {isLoading ? (
                        <p className="text-center text-muted-foreground">Fetching updates...</p>
                    ) : updates.length > 0 ? (
                        updates.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="relative flex gap-4 pl-8"
                            >
                                <div className="absolute left-0 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
                                    {getIconForStatus(item.status)}
                                </div>
                                <div className="absolute left-[9px] top-[26px] h-full w-px bg-slate-200 dark:bg-slate-700" />
                                <div className="flex-1">
                                    <p className="font-semibold text-sm leading-tight">{item.trackingNumber}</p>
                                    <p className="text-xs text-muted-foreground">{item.status}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-medium text-muted-foreground" title={format(item.timestamp, 'PPpp')}>
                                        {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{item.location}</p>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground pt-16">No recent activity found.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}