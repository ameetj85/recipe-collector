import React, { useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';

const RecipeContactForm = ({ recipe }) => {
  const { data: session } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [wasSubmitted, setWasSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      name,
      email,
      phone,
      message,
      recipient: recipe.owner,
      recipe: recipe._id,
    };

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (res.status === 200) {
        toast.success('Message sent successfully');
        setWasSubmitted(true);
      } else if (res.status === 400 || res.status === 401) {
        const dataObj = await res.json();
        toast.error(dataObj.message);
      } else {
        toast.error('Error sending message');
      }
    } catch (error) {
      console.log(error);
      toast.error('Error sending message');
    } finally {
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    }
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
              requiredvalue={name}
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
            >
              <FaPaperPlane /> Send Message
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default RecipeContactForm;
