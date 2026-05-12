export type UserRole = "customer" | "driver" | "owner" | "admin";

export type DeliveryType = "scheduled" | "express";

export type DeliveryStatus =
  | "pending"
  | "awaiting_confirmation"
  | "confirmed"
  | "assigned"
  | "in_progress"
  | "delivered"
  | "cancelled";

export type PaymentStatus =
  | "pending"
  | "authorized"
  | "paid"
  | "failed"
  | "refunded";

export interface AddressValue {
  street: string;
  house: string;
  entrance?: string;
  floor?: string;
  apartment?: string;
  intercomCode?: string;
}

export interface SubscriptionPricingRule {
  waterPrice: number;
  firstBottleServiceFee: number;
  nextBottleServiceFee: number;
  scheduleChangeFee: number;
}

