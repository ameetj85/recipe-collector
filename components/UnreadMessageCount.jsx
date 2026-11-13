'use client';

import { useGlobalContext } from '@/context/GlobalContext';

// The count is loaded on the server by app/layout.jsx and seeded into
// GlobalContext; Message updates it as messages are read or deleted.
const UnreadMessageCount = () => {
  const { unreadCount } = useGlobalContext();

  return (
    unreadCount > 0 && (
      <span className='absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-fuchsia-500 to-pink-500 ring-2 ring-purple-900 rounded-full'>
        {unreadCount}
      </span>
    )
  );
};

export default UnreadMessageCount;
