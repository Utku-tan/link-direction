export type UserRole = 'user' | 'admin';
export type AccountType = 'individual' | 'business';
export type DeviceType = 'mobile' | 'desktop' | 'tablet';

export interface Profile {
  id: string;
  email: string;
  phone: string | null;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  account_type: AccountType;
  business_name: string | null;
  business_cooldown_hours: number;
  max_link_limit: number;
  created_at: string;
  updated_at: string;
}

export interface Link {
  id: string;
  user_id: string;
  slug: string;
  target_url: string;
  is_active: boolean;
  click_count: number;
  created_at: string;
  updated_at: string;
}

export interface NfcDevice {
  id: string;
  device_serial: string;
  user_id: string | null;
  link_id: string | null;
  device_label: string | null;
  is_claimed: boolean;
  claimed_at: string | null;
  created_at: string;
  // Joined fields
  link?: Link;
}

export interface AnalyticsEvent {
  id: string;
  link_id: string;
  clicked_at: string;
  device: string | null;
  browser: string | null;
  referrer: string | null;
  country: string | null;
  ip_hash: string | null;
  ip_address: string | null;
  nfc_device_id: string | null;
  is_cooldown_blocked: boolean;
}

export interface LoyaltyPoints {
  id: string;
  customer_ip: string;
  business_user_id: string;
  nfc_device_id: string | null;
  points: number;
  last_earned_at: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLinkInput {
  slug: string;
  target_url: string;
}

export interface UpdateLinkInput {
  target_url: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  username: string;
  phone?: string;
  full_name?: string;
  account_type?: AccountType;
  business_name?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface DailyClickData {
  date: string;
  clicks: number;
}

export interface DeviceDistribution {
  device: string;
  count: number;
  percentage: number;
}

export interface BrowserDistribution {
  browser: string;
  count: number;
  percentage: number;
}

export interface ReferrerData {
  referrer: string;
  count: number;
}

export interface DashboardStats {
  totalLinks: number;
  activeLinks: number;
  totalClicks: number;
  clicksToday: number;
  totalDevices?: number;
  blockedClicks?: number;
}

export interface AdminUser extends Profile {
  link_count: number;
  device_count: number;
}

export interface AdminLink extends Link {
  username: string;
}

export interface AdminStats {
  totalUsers: number;
  totalLinks: number;
  totalClicks: number;
  usersToday: number;
}
