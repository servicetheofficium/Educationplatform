import { supabase } from './supabase';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  user_type: 'admin' | 'student';
}

// Login with email and password
export async function login(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Auth sign-in error:', error);
      throw error;
    }

    if (!data.user) {
      throw new Error('No user returned from auth');
    }

    console.log('Auth successful, user ID:', data.user.id);

    // Verify user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError) {
      console.error('User query error:', userError);
      console.error('User ID queried:', data.user.id);
      throw new Error(`Failed to fetch user profile: ${userError.message}`);
    }

    if (!userData) {
      throw new Error('User profile not found in database. Please contact admin.');
    }

    console.log('User data retrieved:', userData);

    if (userData.user_type !== 'admin') {
      await supabase.auth.signOut();
      throw new Error('Access denied. Admin users only.');
    }

    return {
      success: true,
      user: userData as AdminUser,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    console.error('Login error:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Logout
export async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Logout failed',
    };
  }
}

// Get current user
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!data.user) return null;

    // Get user details from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError) throw userError;
    return userData as AdminUser;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Create admin user (for initial setup)
export async function createAdminUser(email: string, password: string, fullName: string) {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    if (!authData.user) throw new Error('Failed to create user');

    // Create user record in database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email,
          full_name: fullName,
          user_type: 'admin',
        },
      ])
      .select()
      .single();

    if (userError) throw userError;

    return {
      success: true,
      user: userData as AdminUser,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create admin user',
    };
  }
}
