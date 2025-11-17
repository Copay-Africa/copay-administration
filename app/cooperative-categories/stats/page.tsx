"use client"

import * as React from "react";
import { apiClient } from "@/lib/api-client";
import type { CooperativeCategoryStats } from "@/types";

export default function CategoryStatsPage() {
    const [stats, setStats] = React.useState<CooperativeCategoryStats | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    React.useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await apiClient.cooperativeCategories.getStats();
                setStats(res as CooperativeCategoryStats);
            } catch (err: any) {
                console.error('Failed to load category stats', err);
                setError(err?.message || 'Failed to load stats');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return <div className="p-4">Loading stats...</div>;
    if (error) return <div className="p-4 text-destructive">{error}</div>;

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-xl font-semibold">Category Statistics</h2>
            {stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-background rounded shadow">
                        <div className="text-sm text-muted-foreground">Total Categories</div>
                        <div className="text-2xl font-bold">{stats.totalCategories}</div>
                    </div>
                    <div className="p-4 bg-background rounded shadow">
                        <div className="text-sm text-muted-foreground">Active Categories</div>
                        <div className="text-2xl font-bold">{stats.activeCategories}</div>
                    </div>
                    <div className="p-4 bg-background rounded shadow">
                        <div className="text-sm text-muted-foreground">Total Cooperatives</div>
                        <div className="text-2xl font-bold">{stats.totalCooperatives}</div>
                    </div>
                    <div className="p-4 bg-background rounded shadow">
                        <div className="text-sm text-muted-foreground">Categories With Cooperatives</div>
                        <div className="text-2xl font-bold">{stats.categoriesWithCooperatives}</div>
                    </div>
                </div>
            ) : null}

            <div>
                <h3 className="text-lg font-medium">Top Categories</h3>
                <ul className="mt-2 space-y-2">
                    {stats?.topCategories?.map((t) => (
                        <li key={t.id} className="flex items-center justify-between p-3 bg-background rounded">
                            <div>{t.name}</div>
                            <div className="text-sm text-muted-foreground">{t.cooperativeCount}</div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
