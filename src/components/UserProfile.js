import React from 'react';
import { UserIcon } from '@heroicons/react/outline';

export default function UserProfile({ className = '' }) {
  const user = JSON.parse(localStorage.getItem("cts_user") || "{}");
  
  // Format role display name
  const getRoleDisplayName = (role) => {
    const roleMap = {
      "Student": "Student",
      "Program Coordinator": "Program Coordinator",
      "Subject Method Expert": "Subject Method Expert",
      "Head Of Section": "Head of Section",
      "Administrator": "Admin",
      "Super Admin": "Super Admin",
    };
    return roleMap[role] || role || "Unknown";
  };

  const userName = user.name || user.email?.split('@')[0] || "User";
  const userRole = getRoleDisplayName(user.role);

  return (
    <div className={`rounded-xl border border-gray-200 px-3 py-2 flex items-center gap-3 ${className}`}>
      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-full shadow-sm">
        <UserIcon className="h-5 w-5 text-white" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">{userName}</span>
        <span className="text-[11px] text-gray-600 truncate max-w-[160px]">{userRole}</span>
      </div>
    </div>
  );
}

