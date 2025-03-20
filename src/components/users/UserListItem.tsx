
import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Shield, UserX, Trash2, UserCog, CheckCircle, XCircle } from 'lucide-react';
import { User } from '@/types/user';

interface UserListItemProps {
  user: User;
  isAdmin: boolean;
  onBanUser: (userId: string, isBanned: boolean) => void;
  onDeleteUser: (userId: string) => void;
  onToggleAdmin: (userId: string, makeAdmin: boolean) => void;
  actionLoading: string | null;
}

export const UserListItem = ({
  user,
  isAdmin,
  onBanUser,
  onDeleteUser,
  onToggleAdmin,
  actionLoading
}: UserListItemProps) => {
  // Get the user's display name from various possible sources
  const displayName = user.name || user.user_metadata?.name || user.email.split('@')[0];
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProviderInfo = (provider: string | undefined) => {
    switch (provider?.toLowerCase()) {
      case 'google':
        return { name: 'Google', color: 'text-red-600' };
      case 'github':
        return { name: 'GitHub', color: 'text-gray-800' };
      case 'facebook':
        return { name: 'Facebook', color: 'text-blue-600' };
      case 'twitter':
        return { name: 'Twitter', color: 'text-blue-400' };
      default:
        return { name: 'Email', color: 'text-gray-600' };
    }
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{displayName}</div>
            <div className="text-gray-500 text-xs">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        {user.user_metadata?.banned ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Banned
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        {user.user_metadata?.isAdmin ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            User
          </span>
        )}
      </td>
      {isAdmin && (
        <td className="px-4 py-3">
          <span className={`text-xs ${getProviderInfo(user.app_metadata?.provider).color}`}>
            {getProviderInfo(user.app_metadata?.provider).name}
          </span>
        </td>
      )}
      <td className="px-4 py-3 text-gray-500">
        {formatDate(user.created_at)}
      </td>
      {isAdmin && (
        <td className="px-4 py-3 text-gray-500">
          {user.last_sign_in ? formatDate(user.last_sign_in) : 'Never'}
        </td>
      )}
      <td className="px-4 py-3 text-right space-x-2">
        {!user.user_metadata?.isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleAdmin(user.id, true)}
            disabled={actionLoading === user.id}
            className="h-8 px-2"
          >
            <Shield className="h-4 w-4" />
            <span className="sr-only">Make Admin</span>
          </Button>
        )}
        
        {user.user_metadata?.isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleAdmin(user.id, false)}
            disabled={actionLoading === user.id}
            className="h-8 px-2"
          >
            <UserCog className="h-4 w-4" />
            <span className="sr-only">Remove Admin</span>
          </Button>
        )}
        
        {!user.user_metadata?.banned ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onBanUser(user.id, true)}
            disabled={actionLoading === user.id}
            className="h-8 px-2"
          >
            <UserX className="h-4 w-4" />
            <span className="sr-only">Ban User</span>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onBanUser(user.id, false)}
            disabled={actionLoading === user.id}
            className="h-8 px-2 text-green-600 border-green-200 hover:bg-green-50"
          >
            <CheckCircle className="h-4 w-4" />
            <span className="sr-only">Unban User</span>
          </Button>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDeleteUser(user.id)}
          disabled={actionLoading === user.id}
          className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </td>
    </tr>
  );
};
