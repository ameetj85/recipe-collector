'use client';
import { useState, useTransition } from 'react';
import { toast } from 'react-toastify';
import { useGlobalContext } from '@/context/GlobalContext';
import { toggleMessageRead, deleteMessage } from '@/app/actions/messages';

const Message = ({ message }) => {
  const [isRead, setIsRead] = useState(message.read);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { setUnreadCount } = useGlobalContext();

  const handleReadClick = () => {
    startTransition(async () => {
      const result = await toggleMessageRead(message._id);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      const { read } = result;
      setIsRead(read);
      setUnreadCount((prevCount) =>
        read ? Math.max(prevCount - 1, 0) : prevCount + 1
      );
      toast.success(read ? 'Marked as read' : 'Marked as new');
    });
  };

  const handleDeleteClick = () => {
    const confirmed = window.confirm(
      'Are you sure that you want to delete this message?'
    );

    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteMessage(message._id);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setIsDeleted(true);
      // only an unread message contributes to the unread count
      if (!isRead) {
        setUnreadCount((prevCount) => Math.max(prevCount - 1, 0));
      }
      toast.success('Message Deleted');
    });
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
        <div className='absolute top-4 right-4 badge bg-linear-to-r from-fuchsia-500 to-purple-600 text-white shadow-sm'>
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
        disabled={isPending}
        className={`mt-5 mr-3 text-sm ${
          isRead ? 'btn-secondary' : 'btn-primary'
        }`}
      >
        {isRead ? 'Mark As New' : 'Mark As Read'}
      </button>
      <button
        onClick={handleDeleteClick}
        disabled={isPending}
        className='mt-5 btn-danger text-sm'>
        Delete
      </button>
    </div>
  );
};
export default Message;
