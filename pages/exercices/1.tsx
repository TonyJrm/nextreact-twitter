import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Loader } from '~/components/Loader';
import type { TlTweets } from '~/lib/scheme/tweets';
import { AddTweetForm } from '../../src/components/tweets/AddTweetForm';
import { LikeButton } from '../../src/components/tweets/LikeButton';
import { RepliesButton } from '../../src/components/tweets/RepliesButton';
import { Tweet } from '../../src/components/tweets/Tweet';
import TwitterLayout from '../../src/components/TwitterLayout';
import { z } from 'zod';

const notifyFailed = () => toast.error("Couldn't fetch tweet...");

const TweetsScheme = z.object({
  tweets: z.array(
    z.object({
      id: z.string(),
      content: z.string(),
      createdAt: z.string(),
      user: z.object({
        id: z.string(),
        displayName: z.string().nullable(),
        username: z.string(),
        avatarUrl: z.string().nullable(),
      }),
      likes: z.array(z.number()),
      _count: z.object({
        likes: z.number(),
        replies: z.number(),
      }),
      liked: z.boolean(),
    })
  ),
});

const getTweets = async (signal: AbortSignal) =>
  fetch('/api/tweets', { signal })
    .then((res) => res.json())
    .then((json) => TweetsScheme.parse(json));

export default function FetchAllTweets() {
  const [tweets, setTweets] = useState<TlTweets | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    getTweets(controller.signal)
      .then((data) => {
        const validData = TweetsScheme.parse(data);

        setTweets(validData.tweets);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setTweets([]);
        notifyFailed();
      });

    return () => controller.abort();
  }, []);

  if (!tweets) return <Loader />;

  return (
    <TwitterLayout>
      <AddTweetForm />
      {tweets.map((tweet) => (
        <Tweet key={tweet.id} tweet={tweet}>
          <RepliesButton count={tweet._count.replies} />
          <LikeButton count={tweet._count.likes} />
        </Tweet>
      ))}
    </TwitterLayout>
  );
}
