'use client';

import React from 'react';
import {
  FacebookShareButton,
  XShareButton,
  WhatsappShareButton,
  EmailShareButton,
  FacebookLegacyIcon,
  XLegacyIcon,
  WhatsappLegacyIcon,
  EmailLegacyIcon,
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
          <FacebookLegacyIcon size={40} round={true} />
        </FacebookShareButton>

        <XShareButton
          url={shareUrl}
          title={recipe.name}
          hashtags={[`${recipe.type.trim()}IsYummy`]}
        >
          <XLegacyIcon size={40} round={true} />
        </XShareButton>

        <WhatsappShareButton url={shareUrl} title={recipe.name} separator=':: '>
          <WhatsappLegacyIcon size={40} round={true} />
        </WhatsappShareButton>

        <EmailShareButton
          onClick={() => {}}
          openShareDialogOnClick
          url={shareUrl}
          subject={recipe.name}
          body={`Check out this recipe listing: `}
        >
          <EmailLegacyIcon size={40} round={true} />
        </EmailShareButton>
      </div>
    </div>
  );
};

export default ShareButtons;
