import React, { useState, useEffect } from 'react';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { UserList } from '@/components/users/UserList';
import { 
  getCurrentUser, 
  getAllUsers, 
  deleteUser, 
  toggleUserBan, 
  toggleAdminStatus,
  isUserAdmin
} from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types/user';

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  const fetchCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      if (user?.email) {
        setCurrentUserEmail(user.email);
        setIsAdmin(isUserAdmin(user));
      }
    } catch (error: any) {
      console.error('Error fetching current user:', error);
      toast({
        title: "Error",
        description: `Failed to load current user: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const users = await getAllUsers();
      setUsers(users);
    } catch (error: any) {
      console.error('Error fetching users:', error.message);
      toast({
        title: "Error",
        description: `Failed to load users: ${error.message}`,
        variant: "destructive"
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserEmail) {
      fetchUsers();
    }
  }, [currentUserEmail]);

  const handleBanUser = async (userId: string, isBanned: boolean) => {
    setActionLoading(userId);
    try {
      await toggleUserBan(userId, isBanned);
      
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, user_metadata: { ...user.user_metadata, banned: isBanned } }
          : user
      ));
      
      toast({
        title: "Success",
        description: `User ${isBanned ? 'banned' : 'unbanned'} successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to ${isBanned ? 'ban' : 'unban'} user: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }
    
    setActionLoading(userId);
    try {
      await deleteUser(userId);
      
      setUsers(users.filter(user => user.id !== userId));
      
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleAdmin = async (userId: string, makeAdmin: boolean) => {
    setActionLoading(userId);
    try {
      await toggleAdminStatus(userId, makeAdmin);
      
      setUsers(users.map(user => 
        user.id === userId 
          ? { 
              ...user, 
              user_metadata: { 
                ...user.user_metadata,
                isAdmin: makeAdmin,
                role: makeAdmin ? 'admin' : 'user'
              } 
            } 
          : user
      ));
      
      toast({
        title: "Success",
        description: `User ${makeAdmin ? 'promoted to admin' : 'demoted from admin'} successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to change admin status: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <SidebarLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex items-center text-sm text-gray-500 mt-1">
          <span>Dashboard</span>
          <span className="mx-2">/</span>
          <span>Users</span>
        </div>
      </div>

      <UserList
        users={users}
        loading={loading}
        isAdmin={isAdmin}
        onRefresh={fetchUsers}
        onBanUser={handleBanUser}
        onDeleteUser={handleDeleteUser}
        onToggleAdmin={handleToggleAdmin}
        actionLoading={actionLoading}
      />
    </SidebarLayout>
  );
};

export default Users;
