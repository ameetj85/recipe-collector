'use client';

import React from 'react';
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  EmailShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
  EmailIcon,
} from 'react-share';

const ShareButtons = ({ recipe }) => {
  const shareUrl = `${process.env.NEXT_PUBLIC_DOMAIN}/recipes/${recipe._id}`;

  return (
    <div className='panel p-6'>
      <h3 className='font-display text-xl font-bold text-purple-950 text-center mb-4'>
        Share this Recipe
      </h3>
      <div className='flex gap-3 justify-center'>
        <FacebookShareButton
          url={shareUrl}
          quote={recipe.name}
          hashtag={`#${recipe.type} Is Yummy`}
        >
          <FacebookIcon size={40} round={true} />
        </FacebookShareButton>

        <TwitterShareButton
          url={shareUrl}
          title={recipe.name}
          hashtags={[`${recipe.type.trim()}IsYummy`]}
        >
          <TwitterIcon size={40} round={true} />
        </TwitterShareButton>

        <WhatsappShareButton url={shareUrl} title={recipe.name} separator=':: '>
          <WhatsappIcon size={40} round={true} />
        </WhatsappShareButton>

        <EmailShareButton
          onClick={() => {}}
          openShareDialogOnClick
          url={shareUrl}
          subject={recipe.name}
          body={`Check out this recipe listing: `}
        >
          <EmailIcon size={40} round={true} />
        </EmailShareButton>
      </div>
    </div>
  );
};

export default ShareButtons;
