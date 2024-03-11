import connectDB from '@/config/database';
import Message from '@/models/Message';
import { getSessionUser } from '@/utils/getSessionUser';

export const dynamix = 'force-dynamic';

// GET /api/messages
export const GET = async () => {
  try {
    await connectDB();

    const sessionUser = await getSessionUser();

    if (!sessionUser || !sessionUser.user) {
      return new Response(JSON.stringify('User ID is required'), {
        status: 401,
      });
    }

    const { userId } = sessionUser;

    const readMessages = await Message.find({ recipient: userId, read: true })
      .sort({ createdAt: -1 }) // Sort read messages in asc order
      .populate('sender', 'username')
      .populate('property', 'name');

    const unreadMessages = await Message.find({
      recipient: userId,
      read: false,
    })
      .sort({ createdAt: -1 }) // Sort read messages in asc order
      .populate('sender', 'username')
      .populate('property', 'name');

    const messages = [...unreadMessages, ...readMessages];

    return new Response(JSON.stringify(messages), { status: 200 });
  } catch (error) {
    console.log(error);
    return new Response('Something went wrong', { status: 500 });
  }
};

// POST /api/messages
export const POST = async (req) => {
  try {
    console.log('POST Message');
    await connectDB();

    const { name, message, phone, recipe, email, recipient } = await req.json();

    /*
    console.log(
      'Name: ',
      name,
      'Message: ',
      message,
      'Phone: ',
      phone,
      'Recipe: ',
      recipe,
      'Email: ',
      email,
      'Recipient: ',
      recipient
    );
    */

    const sessionUser = await getSessionUser();

    if (!sessionUser || !sessionUser.user) {
      return new Response(
        JSON.stringify({ message: 'You must be logged in to send a message!' }),
        {
          status: 400,
        }
      );
    }

    const { user } = sessionUser;

    // cannot send message to self
    if (user.id === recipient) {
      return new Response(
        JSON.stringify({ message: 'Cannot send a message to yourself!' }),
        { status: 401 }
      );
    }

    const newMessage = new Message({
      sender: user.id,
      recipient,
      recipe,
      name,
      property: recipe,
      email,
      phone,
      body: message,
    });

    await newMessage.save();

    return new Response(
      JSON.stringify({ message: 'Message sent successfully!' }),
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return new Response('Something went wrong!', { status: 500 });
  }
};
