export type UserRole = 'user' | 'admin';
export type AccountType = 'individual' | 'business';
export type DeviceType = 'mobile' | 'desktop' | 'tablet';
export type TagType = 'point_1' | 'point_2' | 'point_3' | 'point_4' | 'point_5' | 'redeem_tag';

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
  target_stars_for_reward: number;
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
  business_id: string | null;
  tag_type: TagType;
  target_url: string | null;
  created_at: string;
  // Joined fields
  business?: Profile;
}

export interface StampEvent {
  id: string;
  business_id: string;
  visitor_uuid: string;
  visitor_name: string | null;
  tag_type: TagType;
  stars_added: number;
  current_stars: number;
  target_stars: number;
  is_reward: boolean;
  created_at: string;
}

export interface LoyaltyStar {
  id: string;
  business_id: string;
  visitor_uuid: string;
  username: string | null;
  phone_number: string | null;
  current_stars: number;
  total_claimed_rewards: number;
  device_fingerprint: string | null;
  created_at: string;
  updated_at: string;
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
