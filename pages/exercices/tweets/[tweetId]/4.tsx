import { useQuery } from '@tanstack/react-query';
import type { IncomingMessage } from 'http';
import { AddTweet } from '~/components/tweets/AddTweet';
import { TweetWithLikes } from '~/components/tweets/TweetWithLikes';
import TwitterLayout from '~/components/TwitterLayout';
import { getTweet } from '~/db/tweets';
import { client } from '~/lib/client/client';
import { getOptionalUserIdInCookie } from '~/lib/client/getUserIdCookie';
import { TweetScheme, type TweetView } from '~/lib/scheme/tweets';
import { tweetKeys } from '~/lib/tweets/query.tweet';

const getTweetsFromAPI = async (tweetId: string) => {
  return client(`/api/tweets/${tweetId}`, {
    zodSchema: TweetScheme,
  });
};

export default function TweetId({ tweet: defaultTweet }: { tweet: TweetView }) {
  const { data } = useQuery({
    queryKey: tweetKeys.getById(defaultTweet.id),
    queryFn: () => getTweetsFromAPI(defaultTweet.id),
    initialData: {
      tweet: defaultTweet,
    },
  });

  const tweet = data.tweet;

  return (
    <TwitterLayout>
      <TweetWithLikes tweet={tweet} parentTweetId={tweet.id} />
      <AddTweet tweetId={tweet.id} />
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
  const userId = getOptionalUserIdInCookie(context.req);

  const tweet = await getTweet(tweetId, userId);

  return {
    props: {
      tweet,
    },
  };
};
