
import { createClient } from '@supabase/supabase-js';
import { User } from '@/types/user';

// Get environment variables with fallbacks for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Define allowed admin emails
export const ADMIN_EMAIL = 'pritamrouth2003@gmail.com';

// Sample data for the mock client
const mockUsers = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    created_at: new Date().toISOString(),
    last_sign_in: new Date().toISOString(),
    user_metadata: { name: 'Admin User', isAdmin: true, role: 'admin' },
    app_metadata: { provider: 'google' }
  },
  {
    id: '2',
    email: 'user@example.com',
    name: 'Regular User',
    created_at: new Date().toISOString(),
    last_sign_in: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    user_metadata: { name: 'Regular User', isAdmin: false, role: 'user' },
    app_metadata: { provider: 'email' }
  },
  {
    id: '3',
    email: 'banned@example.com',
    name: 'Banned User',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    last_sign_in: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    user_metadata: { name: 'Banned User', isAdmin: false, role: 'user', banned: true },
    app_metadata: { provider: 'github' }
  },
  {
    id: '4',
    email: 'pritamrouth2003@gmail.com',
    name: 'Pritam Routh',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    last_sign_in: new Date().toISOString(),
    user_metadata: { name: 'Pritam Routh', isAdmin: true, role: 'admin' },
    app_metadata: { provider: 'google' }
  }
];

// Create a single supabase client for interacting with your database
export const supabase = (() => {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials are missing. Using mock client for development.');
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } }, error: null }),
        signInWithPassword: async () => ({ 
          data: { user: null, session: null }, 
          error: { message: 'This is a mock client. Set up Supabase credentials to enable authentication.' } 
        }),
        signUp: async () => ({
          data: { user: null, session: null },
          error: { message: 'This is a mock client. Set up Supabase credentials to enable authentication.' }
        }),
        signOut: async () => ({ error: null }),
        admin: {
          listUsers: async () => ({ 
            data: { 
              users: mockUsers
            }, 
            error: null 
          }),
          deleteUser: async (id) => ({ error: null }),
          updateUserById: async (id, data) => ({ error: null })
        }
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
            limit: () => ({ data: [], error: null })
          }),
          limit: () => ({ data: [], error: null }),
          data: mockUsers,
          error: null
        }),
        insert: (data) => {
          console.log('Mock insert:', data);
          return { 
            select: () => ({ data, error: null })
          };
        },
        update: (data) => {
          console.log('Mock update:', data);
          return { 
            eq: () => ({ 
              select: () => ({ data, error: null }) 
            }),
            match: (criteria) => ({ data, error: null })
          };
        },
        delete: () => {
          console.log('Mock delete');
          return { 
            eq: () => ({ data: null, error: null }),
            match: (criteria) => ({ data: null, error: null })
          };
        }
      }),
      rpc: (fnName: string, params?: any) => ({
        then: (callback: Function) => {
          if (fnName === 'is_admin') {
            // Check if the user is admin based on the email in params
            const isAdmin = params?.email === ADMIN_EMAIL || 
                          params?.email === 'admin@example.com';
            return callback({ data: isAdmin, error: null });
          }
          if (fnName === 'get_all_user_data') {
            // Simulating fetching all user data (only returns if admin)
            if (params?.requestor_email === ADMIN_EMAIL || 
                params?.requestor_email === 'admin@example.com') {
              return callback({ 
                data: mockUsers,
                error: null
              });
            } else {
              return callback({ 
                data: null, 
                error: { message: 'Unauthorized. Only admins can access all user data.' } 
              });
            }
          }
          return callback({ data: null, error: null });
        }
      })
    };
  }
  return createClient(supabaseUrl, supabaseKey);
})();

// Additional functions for user management
export const signUp = async (email: string, password: string, name?: string, isAdmin = false) => {
  const forceAdmin = email.toLowerCase() === ADMIN_EMAIL;

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
          isAdmin: forceAdmin || isAdmin,
          role: forceAdmin ? 'admin' : 'user'
        }
      }
    });

    if (error) {
      throw error;
    }

    // Create a profile record if signup is successful
    if (data.user) {
      const profileData = { 
        id: data.user.id,
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const insertResponse = await supabase
        .from('profiles')
        .insert([profileData])
        .select();
      
      if (insertResponse.error) {
        console.error('Error creating profile:', insertResponse.error);
      }
    }

    return data;
  } catch (error) {
    console.error('Error in signUp:', error);
    throw error;
  }
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase(),
    password
  });

  if (error) {
    throw error;
  }

  const user = data.user;
  if (user && isUserAdmin(user)) {
    user.role = 'admin';
  }

  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw error;
  }
};

export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (user && isUserAdmin(user)) {
    user.role = 'admin';
  }

  return user;
};

export const isUserAdmin = (user: any) => {
  return (
    user?.email?.toLowerCase() === ADMIN_EMAIL ||
    user?.user_metadata?.isAdmin === true ||
    user?.user_metadata?.role === 'admin'
  );
};

// Get all users from the profiles table
export const getAllUsers = async (): Promise<User[]> => {
  try {
    // For the mock client, we'll return the mockUsers
    if (!supabaseUrl || !supabaseKey) {
      return mockUsers as User[];
    }
    
    // For the real client, fetch from profiles table
    const response = await supabase
      .from('profiles')
      .select('*');
    
    if (response.error) {
      throw response.error;
    }
    
    // Transform the profiles data to match our User interface
    const users = (response.data || []).map(profile => ({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      // Add any user metadata from auth if needed
      user_metadata: {
        // Default values, these would need to be updated from auth if needed
        isAdmin: profile.is_admin || profile.email.toLowerCase() === ADMIN_EMAIL,
        role: (profile.is_admin || profile.email.toLowerCase() === ADMIN_EMAIL) ? 'admin' : 'user',
        banned: profile.banned || false,
        name: profile.name
      },
      app_metadata: {
        provider: profile.provider || 'email' // Default provider
      }
    }));
    
    return users;
  } catch (error: any) {
    console.error('Error fetching all users:', error.message);
    throw error;
  }
};

// Update a user in the profiles table
export const updateUser = async (userId: string, userData: Partial<User>) => {
  try {
    const updateData = {
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      avatar_url: userData.avatar_url,
      updated_at: new Date().toISOString(),
      // Add these fields if you have them in your profiles table
      is_admin: userData.user_metadata?.isAdmin,
      banned: userData.user_metadata?.banned
    };
    
    const response = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select();
    
    if (response.error) {
      throw response.error;
    }
    
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Error updating user:', error.message);
    throw error;
  }
};

// Delete a user from the profiles table
export const deleteUser = async (userId: string) => {
  try {
    const response = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (response.error) {
      throw response.error;
    }
    
    // Note: This only deletes the profile record
    // To delete the actual auth user, you would need admin APIs
    
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting user:', error.message);
    throw error;
  }
};

// Ban/unban a user (store this in user metadata)
export const toggleUserBan = async (userId: string, isBanned: boolean) => {
  try {
    const response = await supabase
      .from('profiles')
      .update({
        banned: isBanned,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select();
    
    if (response.error) {
      throw response.error;
    }
    
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Error toggling user ban status:', error.message);
    throw error;
  }
};

// Toggle admin status (store this in user metadata)
export const toggleAdminStatus = async (userId: string, isAdmin: boolean) => {
  try {
    const response = await supabase
      .from('profiles')
      .update({
        is_admin: isAdmin,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select();
    
    if (response.error) {
      throw response.error;
    }
    
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Error toggling admin status:', error.message);
    throw error;
  }
};
