'use client';

import { useFormStatus } from 'react-dom';

// Submit button for forms driven by a Server Action. Disables itself and
// shows pendingText while the action (e.g. image upload) is running.
// Must be rendered inside the <form>.
const SubmitButton = ({ children, pendingText = 'Saving...', className }) => {
  const { pending } = useFormStatus();

  return (
    <button className={className} type='submit' disabled={pending}>
      {pending ? pendingText : children}
    </button>
  );
};

export default SubmitButton;
