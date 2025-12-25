import React from 'react';
import { UserIcon } from '@heroicons/react/outline';

export default function UserProfile() {
  const user = JSON.parse(localStorage.getItem("cts_user") || "{}");
  
  // Format role display name
  const getRoleDisplayName = (role) => {
    const roleMap = {
      "Student": "Student",
      "Program Coordinator": "Program Coordinator",
      "Subject Method Expert": "Subject Method Expert",
      "Head Of Section": "Head of Section",
      "Administrator": "Admin"
    };
    return roleMap[role] || role || "Unknown";
  };

  const userName = user.name || user.email?.split('@')[0] || "User";
  const userRole = getRoleDisplayName(user.role);

  return (
    <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-3 flex items-center gap-3">
      <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-full">
        <UserIcon className="h-6 w-6 text-indigo-600" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-gray-800">{userName}</span>
        <span className="text-xs text-gray-500">{userRole}</span>
      </div>
    </div>
  );
}

