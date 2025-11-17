"use client"

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PaymentDistributionFilters } from "@/types";
import { Filter, X, Search, Calendar, Building2, DollarSign } from "lucide-react";

interface Props {
  filters: PaymentDistributionFilters;
  onFiltersChange: (filters: PaymentDistributionFilters) => void;
  onClearFilters: () => void;
}

export function DistributionFilters({ filters, onFiltersChange, onClearFilters }: Props) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const updateFilter = (key: keyof PaymentDistributionFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined, // Convert empty strings to undefined
    });
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => 
      value !== undefined && value !== null && value !== ''
    ).length;
  };

  const hasActiveFilters = getActiveFiltersCount() > 0;

  // Generate month options for the last 12 months
  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    
    return options;
  };

  // Generate year options
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 5; i++) {
      years.push(currentYear - i);
    }
    return years;
  };

  return (
    <Card className="border-copay-light-gray">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-copay-blue" />
            <CardTitle className="text-sm font-medium">Filters</CardTitle>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                {getActiveFiltersCount()} active
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClearFilters}
                className="h-7 px-2 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-7 px-2 text-xs"
            >
              {isExpanded ? 'Less' : 'More'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Always visible filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-copay-gray flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              Month
            </Label>
            <Select 
              value={filters.month || ""} 
              onValueChange={(value) => updateFilter('month', value)}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="All months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All months</SelectItem>
                {getMonthOptions().map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-copay-gray flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              Year
            </Label>
            <Select 
              value={filters.year?.toString() || ""} 
              onValueChange={(value) => updateFilter('year', value ? parseInt(value) : undefined)}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="All years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All years</SelectItem>
                {getYearOptions().map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-copay-gray">Status</Label>
            <Select 
              value={filters.status || ""} 
              onValueChange={(value) => updateFilter('status', value)}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROCESSED">Processed</SelectItem>
                <SelectItem value="DISTRIBUTED">Distributed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Expandable filters */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-copay-light-gray">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-copay-gray flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Min Amount (RWF)
                </Label>
                <Input
                  type="number"
                  value={filters.minAmount || ""}
                  onChange={(e) => updateFilter('minAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="0"
                  className="h-8"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-copay-gray flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Max Amount (RWF)
                </Label>
                <Input
                  type="number"
                  value={filters.maxAmount || ""}
                  onChange={(e) => updateFilter('maxAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="No limit"
                  className="h-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-copay-gray flex items-center">
                <Building2 className="h-3 w-3 mr-1" />
                Cooperative ID
              </Label>
              <Input
                value={filters.cooperativeId || ""}
                onChange={(e) => updateFilter('cooperativeId', e.target.value)}
                placeholder="Search by cooperative ID"
                className="h-8"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}