/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Room Management Utilities
 * Helper functions for managing tenant room assignments
 */

import { apiClient } from "./api-client";
import type {
  AssignToRoomRequest,
  RemoveFromRoomRequest,
  TransferTenantRequest,
} from "@/types";

/**
 * Room Management Helper Class
 * Provides convenient methods for room-related tenant operations
 */
export class RoomManager {
  /**
   * Assign a tenant to a specific room
   * @param cooperativeId - ID of the cooperative
   * @param tenantId - ID of the tenant
   * @param roomNumber - Room number to assign
   * @param notes - Optional assignment notes
   */
  static async assignTenantToRoom(
    cooperativeId: string,
    tenantId: string,
    roomNumber: string,
    notes?: string
  ) {
    const request: AssignToRoomRequest = {
      cooperativeId,
      roomNumber,
      notes: notes || "",
    };

    return await apiClient.tenants.assignToRoom(tenantId, request);
  }

  /**
   * Remove a tenant from their current room
   * @param cooperativeId - ID of the cooperative
   * @param tenantId - ID of the tenant
   * @param reason - Reason for removal
   */
  static async removeTenantFromRoom(
    cooperativeId: string,
    tenantId: string,
    roomNumber: string,
    reason: string
  ) {
    const request: RemoveFromRoomRequest = {
      cooperativeId,
      roomNumber,
      reason,
    };

    return await apiClient.tenants.removeFromRoom(tenantId, request);
  }

  /**
   * Transfer a tenant to a different room (within same or different cooperative)
   * @param tenantId - ID of the tenant
   * @param fromCooperativeId - Current cooperative ID
   * @param fromRoomNumber - Current room number
   * @param toCooperativeId - Target cooperative ID
   * @param toRoomNumber - Target room number
   * @param reason - Reason for transfer
   */
  static async transferTenant(
    tenantId: string,
    fromCooperativeId: string,
    fromRoomNumber: string,
    toCooperativeId: string,
    toRoomNumber: string,
    reason: string
  ) {
    const request: TransferTenantRequest = {
      fromCooperativeId,
      fromRoomNumber,
      toCooperativeId,
      toRoomNumber,
      reason,
    };

    return await apiClient.tenants.transfer(tenantId, request);
  }

  /**
   * Get all tenants in a specific room
   * @param cooperativeId - ID of the cooperative
   * @param roomNumber - Room number
   */
  static async getTenantsInRoom(cooperativeId: string, roomNumber: string) {
    return await apiClient.tenants.getRoomTenants(cooperativeId, roomNumber);
  }

  /**
   * Get all available rooms in a cooperative
   * @param cooperativeId - ID of the cooperative
   */
  static async getAvailableRooms(cooperativeId: string) {
    return await apiClient.tenants.getAvailableRooms(cooperativeId);
  }

  /**
   * Remove multiple tenants from their rooms in bulk
   * @param cooperativeId - ID of the cooperative
   * @param tenantRoomPairs - Array of tenant ID and room number pairs
   * @param reason - Reason for bulk removal
   */
  static async bulkRemoveFromRooms(
    cooperativeId: string,
    tenantRoomPairs: { tenantId: string; roomNumber: string }[],
    reason: string
  ) {
    const promises = tenantRoomPairs.map(({ tenantId, roomNumber }) =>
      this.removeTenantFromRoom(cooperativeId, tenantId, roomNumber, reason)
    );

    return await Promise.allSettled(promises);
  }

  /**
   * Validate room assignment before processing
   * @param cooperativeId - ID of the cooperative
   * @param roomNumber - Room number to validate
   */
  static async validateRoomAvailability(
    cooperativeId: string,
    roomNumber: string
  ) {
    try {
      const response = await this.getTenantsInRoom(cooperativeId, roomNumber);
      const tenants = Array.isArray(response) ? response : [];
      return {
        isAvailable: tenants.length === 0,
        currentOccupants: tenants.length,
        tenants,
      };
    } catch (error) {
      throw new Error(`Failed to validate room availability: ${error}`);
    }
  }
}

/**
 * Export individual functions for direct usage
 */
export const {
  assignTenantToRoom,
  removeTenantFromRoom,
  transferTenant,
  getTenantsInRoom,
  getAvailableRooms,
  bulkRemoveFromRooms,
  validateRoomAvailability,
} = RoomManager;
