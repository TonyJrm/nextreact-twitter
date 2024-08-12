import type { IncomingMessage } from 'http';
import { AddTweet } from '~/components/tweets/AddTweet';
import { TweetWithLikes } from '~/components/tweets/TweetWithLikes';
import TwitterLayout from '~/components/TwitterLayout';
import { getTweet } from '~/db/tweets';
import { getOptionalUserIdInCookie } from '~/lib/client/getUserIdCookie';
import type { TweetView } from '~/lib/scheme/tweets';

export default function TweetId({ tweet }: { tweet: TweetView }) {
  return (
    <TwitterLayout>
      {/* 🦁 Affiche le TweetWithLikes */}
      <TweetWithLikes tweet={tweet} parentTweetId={tweet.id} />
      <AddTweet />
      <h2 className="p-4 text-xl font-bold">Replies</h2>
      {tweet.replies?.map((reply) => (
        <TweetWithLikes key={reply.id} tweet={reply} parentTweetId={tweet.id} />
      ))}
    </TwitterLayout>
  );
}

export const getServerSideProps = async (context: {
  params: { tweetId: string };
  req: IncomingMessage;
}) => {
  const { tweetId } = context.params;
  // 🦁 Récupère le userId avec la fonction getOptionalUserIdInCookie
  const userId = getOptionalUserIdInCookie(context.req);

  // 🦁 Récupère le tweet avec la fonction getTweet
  const tweet = await getTweet(tweetId, userId);

  return {
    props: {
      // ⚠️ Utilise le trick de JSON pour copier l'objet tweet
      tweet,
    },
  };
};
