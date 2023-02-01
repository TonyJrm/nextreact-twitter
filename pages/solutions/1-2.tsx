import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { Loader } from '~/components/Loader';
import type { TlTweets } from '~/lib/scheme/tweets';
import { AddTweetForm } from '../../src/components/tweets/AddTweetForm';
import { Like } from '../../src/components/tweets/Like';
import { Replies } from '../../src/components/tweets/Replies';
import { Tweet } from '../../src/components/tweets/Tweet';
import TwitterLayout from '../../src/components/TwitterLayout';

const notifyFailed = () => toast.error("Couldn't fetch tweet...");

const TweetsScheme = z.object({
  tweets: z.array(
    z.object({
      id: z.string(),
      content: z.string(),
      createdAt: z.string(),
      user: z.object({
        id: z.string(),
        displayName: z.string(),
        username: z.string(),
        avatarUrl: z.string(),
      }),
      liked: z.boolean(),
      _count: z.object({
        likes: z.number(),
        replies: z.number(),
      }),
    })
  ),
});

const getTweets = async (signal: AbortSignal) =>
  fetch(`/api/tweets`, { signal })
    .then((res) => res.json())
    .then((data) => TweetsScheme.parse(data));

export default function FetchAllTweets() {
  const [tweets, setTweets] = useState<TlTweets | null>();

  useEffect(() => {
    const abortController = new AbortController();

    getTweets(abortController.signal)
      .then((data) => {
        setTweets(data.tweets);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;

        notifyFailed();
        setTweets([]);
      });

    return () => {
      abortController.abort();
    };
  }, []);

  if (!tweets) return <Loader />;

  return (
    <TwitterLayout>
      <AddTweetForm />
      {tweets.map((tweet) => (
        <Tweet key={tweet.id} tweet={tweet}>
          <Replies count={tweet._count.replies} />
          <Like count={tweet._count.likes} liked={tweet.liked} />
        </Tweet>
      ))}
    </TwitterLayout>
  );
}
