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

export type ClientConfig<T> = {
  data?: unknown;
  zodSchema?: z.ZodSchema<T>;
  method?: 'DELETE' | 'GET' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT';
  headers?: HeadersInit;
  customConfig?: RequestInit;
  signal?: AbortSignal;
};

export async function client<T>(
  url: string,
  {
    data,
    zodSchema,
    method,
    headers: customHeaders,
    signal,
    customConfig,
  }: ClientConfig<T> = {}
): Promise<T> {
  const config: RequestInit = {
    method: method ?? (data ? 'POST' : 'GET'),
    body: data ? JSON.stringify(data) : null,
    headers: {
      'Content-Type': data ? 'application/json' : '',
      Accept: 'application/json',
      ...customHeaders,
    },
    signal,
    ...customConfig,
  };

  return window.fetch(url, config).then(async (response) => {
    if (response.status === 401) {
      return Promise.reject(new Error("You're not authenticated"));
    }

    let result = null;
    try {
      result = response.status === 204 ? null : await response.json();
    } catch (error: unknown) {
      return Promise.reject(error);
    }

    if (response.ok) {
      return zodSchema && result ? zodSchema.parse(result) : result;
    } else {
      return Promise.reject(result);
    }
  });
}

const getTweets = async (signal: AbortSignal) =>
  client('/api/tweets', { signal, zodSchema: TweetsScheme });

export default function FetchAllTweets() {
  const [tweets, setTweets] = useState<TlTweets | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    getTweets(controller.signal)
      .then((data) => {
        setTweets(data.tweets);
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
