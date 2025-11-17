"use client"

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import type { CooperativeCategory } from "@/types";

interface Props {
  category: CooperativeCategory;
  onEdit?: (c: CooperativeCategory) => void;
  onDeleted?: (id: string) => void;
}

export function CategoryCard({ category, onEdit, onDeleted }: Props) {
  const [loading, setLoading] = React.useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete category "${category.name}"?`)) return;
    setLoading(true);
    try {
      await apiClient.cooperativeCategories.delete(category.id);
      onDeleted?.(category.id);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow border-copay-light-gray">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="min-w-0 flex-1">
            <div className="font-medium text-copay-navy truncate">{category.name}</div>
            <div className="text-sm text-copay-gray truncate">{category.description || 'No description'}</div>
            <div className="text-xs text-copay-gray mt-1">
              {category.cooperativeCount ?? 0} cooperative{(category.cooperativeCount ?? 0) !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!category.isActive && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
              Inactive
            </span>
          )}
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onEdit?.(category)}
            className="text-copay-navy border-copay-light-gray hover:bg-copay-light-blue"
          >
            Edit
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleDelete} 
            disabled={loading}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            {loading ? '...' : 'Delete'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default CategoryCard;
