"use client"

import * as React from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";
import type { CooperativeCategory } from "@/types";

interface Props {
    initial?: CooperativeCategory | null;
    onSaved?: (c: CooperativeCategory) => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function CategoryDialog({ initial = null, onSaved, open: openProp, onOpenChange, trigger }: Props) {
    const [openInternal, setOpenInternal] = React.useState(false);
    const isControlled = typeof openProp === 'boolean';
    const open = isControlled ? openProp : openInternal;
    const setOpen = (v: boolean) => {
        if (!isControlled) setOpenInternal(v);
        onOpenChange?.(v);
    };
    const [name, setName] = React.useState(initial?.name || "");
    const [description, setDescription] = React.useState(initial?.description || "");
    const [isActive, setIsActive] = React.useState(initial?.isActive ?? true);
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        if (initial) {
            setName(initial.name);
            setDescription(initial.description || "");
            setIsActive(initial.isActive ?? true);
        }
        // if initial is null, reset fields when controlled open is false
        if (!initial && !open) {
            setName("");
            setDescription("");
            setIsActive(true);
        }
    }, [initial, open]);

    const handleSave = async () => {
        if (!name.trim()) return alert('Name is required');
        setSaving(true);
        try {
            const payload = { name, description, isActive };
            let saved: CooperativeCategory;
            if (initial?.id) {
                saved = await apiClient.cooperativeCategories.update(initial.id, payload);
            } else {
                saved = await apiClient.cooperativeCategories.create(payload);
            }
            onSaved?.(saved);
            setOpen(false);
        } catch (err: any) {
            alert(err?.message || 'Failed to save category');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!isControlled && (
                <DialogTrigger asChild>
                    {trigger || <Button variant="default">{initial ? 'Edit Category' : 'Create Category'}</Button>}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-copay-navy">{initial ? 'Edit Category' : 'Create Category'}</DialogTitle>
                    <DialogDescription className="text-copay-gray">
                        {initial ? 'Update cooperative category details' : 'Create a new cooperative category to organize your cooperatives'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-copay-navy">Name</Label>
                        <Input 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            placeholder="e.g., Residential Apartment"
                            className="border-copay-light-gray focus:border-copay-blue"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-copay-navy">Description</Label>
                        <Input 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            placeholder="Brief description of this category"
                            className="border-copay-light-gray focus:border-copay-blue"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input 
                            id="activeToggle" 
                            type="checkbox" 
                            checked={isActive} 
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="rounded border-copay-light-gray text-copay-blue focus:ring-copay-blue"
                        />
                        <Label htmlFor="activeToggle" className="text-sm font-medium text-copay-navy">Active Category</Label>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSave} 
                        disabled={saving || !name.trim()}
                        className="bg-copay-navy hover:bg-copay-navy/90"
                    >
                        {saving ? 'Saving...' : (initial ? 'Update Category' : 'Create Category')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default CategoryDialog;
