"use client"

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PaymentDistributionSummary } from "@/types";
import { Building2, DollarSign, Users, Calendar, Eye, ArrowRight } from "lucide-react";

interface Props {
  distribution: PaymentDistributionSummary;
  onViewDetails?: (distribution: PaymentDistributionSummary) => void;
  showActions?: boolean;
}

export function DistributionSummaryCard({ distribution, onViewDetails, showActions = true }: Props) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: PaymentDistributionSummary['status']) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      PROCESSED: 'bg-blue-100 text-blue-800 border-blue-200',
      DISTRIBUTED: 'bg-green-100 text-green-800 border-green-200'
    };

    return (
      <Badge className={colors[status]}>
        {status}
      </Badge>
    );
  };

  const getStatusIcon = (status: PaymentDistributionSummary['status']) => {
    switch (status) {
      case 'PENDING':
        return '⏳';
      case 'PROCESSED':
        return '⚡';
      case 'DISTRIBUTED':
        return '✅';
      default:
        return '📊';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-copay-light-gray">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-copay-blue/10 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-copay-blue" />
            </div>
            <div>
              <CardTitle className="text-lg text-copay-navy">{distribution.cooperativeName}</CardTitle>
              <p className="text-sm text-copay-gray">Code: {distribution.cooperativeCode}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getStatusIcon(distribution.status)}</span>
            {getStatusBadge(distribution.status)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Distribution Amount */}
        <div className="text-center p-4 bg-copay-blue/5 rounded-lg border border-copay-blue/20">
          <p className="text-sm text-copay-gray mb-1">Amount to Distribute</p>
          <p className="text-2xl font-bold text-copay-blue">{formatCurrency(distribution.totalBaseAmount)}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <DollarSign className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-xs text-copay-gray">Fees Collected</span>
            </div>
            <p className="font-semibold text-green-600">{formatCurrency(distribution.totalFees)}</p>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Users className="h-4 w-4 text-copay-navy mr-1" />
              <span className="text-xs text-copay-gray">Total Payments</span>
            </div>
            <p className="font-semibold text-copay-navy">{distribution.totalPayments}</p>
          </div>
        </div>

        {/* Payment Status Breakdown */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div>
              <span className="text-copay-gray">Completed:</span>
              <span className="ml-1 font-semibold text-green-600">{distribution.completedPaymentsCount}</span>
            </div>
            <div>
              <span className="text-copay-gray">Pending:</span>
              <span className="ml-1 font-semibold text-amber-600">{distribution.pendingPaymentsCount}</span>
            </div>
          </div>
        </div>

        {/* Month and Date Info */}
        <div className="flex items-center justify-between text-xs text-copay-gray pt-2 border-t border-copay-light-gray">
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            <span>Month: {distribution.month}</span>
          </div>
          {distribution.lastDistributedAt && (
            <span>Distributed: {new Date(distribution.lastDistributedAt).toLocaleDateString()}</span>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex space-x-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onViewDetails?.(distribution)}
              className="flex-1"
            >
              <Eye className="h-3 w-3 mr-1" />
              View Details
            </Button>
            
            {distribution.status !== 'DISTRIBUTED' && (
              <Button 
                size="sm" 
                className="bg-copay-blue hover:bg-copay-blue/90"
                onClick={() => {
                  // Handle process action
                  console.log('Process distribution:', distribution.cooperativeId);
                }}
              >
                <ArrowRight className="h-3 w-3 mr-1" />
                Process
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}