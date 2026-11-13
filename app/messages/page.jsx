import React from 'react';
import Messages from '@/components/Messages';
import { getSessionUser } from '@/utils/getSessionUser';
import { getMessages } from '@/utils/queries';

const MessagesPage = async () => {
  // middleware.js guards this route, so a session is expected
  const sessionUser = await getSessionUser();
  const messages = await getMessages(sessionUser?.userId);

  return <Messages messages={messages} />;
};

export default MessagesPage;
