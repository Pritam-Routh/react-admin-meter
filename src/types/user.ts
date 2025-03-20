
export interface User {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
  last_sign_in?: string;
  user_metadata?: {
    isAdmin?: boolean;
    role?: string;
    banned?: boolean;
  };
  app_metadata?: {
    provider?: string;
  };
}
