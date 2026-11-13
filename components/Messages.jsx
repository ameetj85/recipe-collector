'use client';

import React, { useState, useEffect } from 'react';
import Spinner from '@/components/Spinner';
import Message from '@/components/Message';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getMessages = async () => {
      try {
        const res = await fetch('/api/messages');

        if (res.status === 200) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (error) {
        console.log('Error fetching messages: ', error);
      } finally {
        setLoading(false);
      }
    };

    getMessages();
  }, []);

  return loading ? (
    <Spinner loading={loading} />
  ) : (
    <section className='page-bg min-h-[60vh]'>
      <div className='container m-auto py-16 max-w-4xl'>
        <div className='m-4 md:m-0'>
          <h1 className='font-display text-4xl font-bold gradient-text mb-8'>
            Your Messages
          </h1>

          <div className='space-y-4'>
            {messages.length === 0 ? (
              <div className='panel p-10 text-center text-purple-700'>
                You have no messages
              </div>
            ) : (
              messages.map((message) => (
                <Message key={message._id} message={message} />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Messages;
