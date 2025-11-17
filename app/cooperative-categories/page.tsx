"use client"

import * as React from "react";
import { apiClient } from "@/lib/api-client";
import { PREDEFINED_CATEGORIES } from "@/lib/cooperative-categories";
import type { CooperativeCategory } from "@/types";
import CategoryCard from "@/components/cooperative-categories/category-card";
import CategoryDialog from "@/components/cooperative-categories/category-dialog";
import { Button } from "@/components/ui/button";

export default function CooperativeCategoriesPage() {
    const [categories, setCategories] = React.useState<CooperativeCategory[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");
    const [editing, setEditing] = React.useState<CooperativeCategory | null>(null);

    const fetch = React.useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await apiClient.cooperativeCategories.getAll({ page: 1, limit: 50 });
            // The paginated response follows { data: [], pagination: { ... } }
            const data = (res && (res as any).data) ? (res as any).data : (res as any);
            // normalize if necessary
            const list: CooperativeCategory[] = Array.isArray(data) ? data : (res as any).data || [];
            setCategories(list);
        } catch (err: any) {
            console.error('Failed to load categories:', err);
            setError(err?.message || 'Failed to load categories');
            if (process.env.NODE_ENV === 'development') {
                setCategories(PREDEFINED_CATEGORIES as CooperativeCategory[]);
                setError('');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetch();
    }, [fetch]);

    const handleSaved = (c: CooperativeCategory) => {
        // if exists, replace, else add
        setCategories((prev) => {
            const exists = prev.find((p) => p.id === c.id);
            if (exists) return prev.map((p) => (p.id === c.id ? c : p));
            return [c, ...prev];
        });
    };

    const handleDeleted = (id: string) => {
        setCategories((prev) => prev.filter((p) => p.id !== id));
    };

    return (
        <div className="space-y-4 p-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Cooperative Categories</h1>
                <div className="flex items-center gap-2">
                    <CategoryDialog onSaved={handleSaved} />
                    <Button variant="outline" onClick={fetch}>Refresh</Button>
                </div>
            </div>

            {error ? <div className="text-destructive">{error}</div> : null}

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((c) => (
                        <CategoryCard key={c.id} category={c} onEdit={(cat) => setEditing(cat)} onDeleted={handleDeleted} />
                    ))}
                </div>
            )}

            {editing ? (
                <CategoryDialog
                    initial={editing}
                    onSaved={(c) => {
                        handleSaved(c);
                        setEditing(null);
                    }}
                    open={!!editing}
                    onOpenChange={(v) => {
                        if (!v) setEditing(null);
                    }}
                />
            ) : null}
        </div>
    );
}
