'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useGlobalContext } from '@/context/GlobalContext';

const Message = ({ message }) => {
  const [isRead, setIsRead] = useState(message.read);
  const [isDeleted, setIsDeleted] = useState(false);

  const { setUnreadCount } = useGlobalContext();

  const handleReadClick = async () => {
    try {
      const res = await fetch(`/api/messages/${message._id}`, {
        method: 'PUT',
      });

      if (res.status === 200) {
        const { read } = await res.json();
        setIsRead(read);
        setUnreadCount((prevCount) => (read ? prevCount - 1 : prevCount + 1));
        if (read) {
          toast.success('Marked as read');
        } else {
          toast.success('Marked as new');
        }
      }
    } catch (error) {
      console.log(error);
      toast.error('Something went wrong');
    }
  };

  const handleDeleteClick = async () => {
    const confirmed = window.confirm(
      'Are you sure that you want to delete this message?'
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/messages/${message._id}`, {
        method: 'DELETE',
      });

      if (res.status === 201) {
        setIsDeleted(true);
        // only an unread message contributes to the unread count
        if (!isRead) {
          setUnreadCount((prevCount) => Math.max(prevCount - 1, 0));
        }
        toast.success('Message Deleted');
      }
    } catch (error) {
      console.log(error);
      toast.error('Message was not deleted');
    }
  };

  if (isDeleted) {
    return null;
  }

  return (
    <div
      className={`relative panel p-6 border-l-4 ${
        isRead ? 'border-l-purple-200' : 'border-l-fuchsia-500'
      }`}
    >
      {!isRead && (
        <div className='absolute top-4 right-4 badge bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow'>
          New
        </div>
      )}
      <h2 className='text-xl mb-4 pr-16 text-purple-950'>
        <span className='font-semibold text-purple-600'>Recipe Inquiry:</span>{' '}
        {message.property.name}
      </h2>
      <p className='text-slate-700 bg-purple-50/70 rounded-xl p-4'>
        {message.body}
      </p>

      <ul className='mt-4 space-y-1 text-sm text-slate-600'>
        <li>
          <strong className='text-purple-900'>Name:</strong>{' '}
          {message.sender.username}
        </li>

        <li>
          <strong className='text-purple-900'>Reply Email:</strong>{' '}
          <a
            href={`mailto:${message.email}`}
            target='_blank'
            className='text-purple-600 hover:text-fuchsia-600'
          >
            {message.email}
          </a>
        </li>
        <li>
          <strong className='text-purple-900'>Reply Phone:</strong>{' '}
          <a
            href={`tel:${message.phone}`}
            className='text-purple-600 hover:text-fuchsia-600'
          >
            {message.phone}
          </a>
        </li>
        <li>
          <strong className='text-purple-900'>Received:</strong>{' '}
          {new Date(message.createdAt).toLocaleString()}
        </li>
      </ul>
      <button
        onClick={handleReadClick}
        className={`mt-5 mr-3 text-sm ${
          isRead ? 'btn-secondary' : 'btn-primary'
        }`}
      >
        {isRead ? 'Mark As New' : 'Mark As Read'}
      </button>
      <button onClick={handleDeleteClick} className='mt-5 btn-danger text-sm'>
        Delete
      </button>
    </div>
  );
};
export default Message;
