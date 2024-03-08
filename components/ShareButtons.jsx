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
    <>
      <h3 className='text-xl.font-bold.text-center.pt-2'>Share this Recipe</h3>
      <div className='flex gap-3 justify-center pb-5'>
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
    </>
  );
};

export default ShareButtons;
