'use client';

import React, { useState, useTransition } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import { sendMessage } from '@/app/actions/messages';

const RecipeContactForm = ({ recipe }) => {
  const { data: session } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e) => {
    e.preventDefault();

    startTransition(async () => {
      // the recipient is resolved on the server from the recipe's owner
      const result = await sendMessage({
        recipeId: recipe._id,
        name,
        email,
        phone,
        message,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Message sent successfully');
      setWasSubmitted(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    });
  };

  return (
    <div className='panel p-6'>
      <h3 className='font-display text-xl font-bold text-purple-950 mb-6'>
        Contact Recipe Publisher
      </h3>
      {!session ? (
        <p className='rounded-xl bg-purple-50 p-4 text-sm text-purple-700'>
          You must be logged in to send a message
        </p>
      ) : wasSubmitted ? (
        <p className='rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700'>
          Your message has been sent successfully
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className='mb-4'>
            <label
              className='form-label'
              htmlFor='name'
            >
              Name:
            </label>
            <input
              className='form-input'
              id='name'
              type='text'
              placeholder='Enter your name'
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className='mb-4'>
            <label
              className='form-label'
              htmlFor='email'
            >
              Email:
            </label>
            <input
              className='form-input'
              id='email'
              type='email'
              placeholder='Enter your email'
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className='mb-4'>
            <label
              className='form-label'
              htmlFor='phone'
            >
              Phone:
            </label>
            <input
              className='form-input'
              id='phone'
              type='text'
              placeholder='Enter your phone number'
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className='mb-4'>
            <label
              className='form-label'
              htmlFor='message'
            >
              Message:
            </label>
            <textarea
              className='form-input h-40'
              id='message'
              placeholder='Enter your message'
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            ></textarea>
          </div>
          <div>
            <button
              className='btn-primary w-full py-3'
              type='submit'
              disabled={isPending}
            >
              <FaPaperPlane /> {isPending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default RecipeContactForm;
