'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { PaginatedResult, ProfileComment, UserProfile } from '@cms-be-all/shared';
import { apiFetch, ApiError } from '../../../lib/api-client';
import { useAuth } from '../../../lib/auth-context';
import { formatDateTime } from '../../../lib/format-date';
import { Breadcrumb } from '../../../components/breadcrumb';
import { Avatar } from '../../../components/avatar';
import { RoleBadges } from '../../../components/role-badges';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: viewer } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [comments, setComments] = useState<PaginatedResult<ProfileComment> | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [commentBody, setCommentBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function refreshProfile() {
    apiFetch<UserProfile>(`/users/by-username/${username}`)
      .then((data) => {
        setProfile(data);
        return apiFetch<PaginatedResult<ProfileComment>>(`/users/${data.id}/comments`);
      })
      .then(setComments)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load profile');
        }
      });
  }

  useEffect(refreshProfile, [username]);

  useEffect(() => {
    if (!viewer || !profile) return;
    apiFetch<Array<{ username: string }>>(`/users/${viewer.id}/following`)
      .then((following) => setIsFollowing(following.some((f) => f.username === profile.username)))
      .catch(() => setIsFollowing(false));
  }, [viewer, profile]);

  async function toggleFollow() {
    if (!profile) return;
    setFollowBusy(true);
    setError(null);
    try {
      if (isFollowing) {
        await apiFetch(`/users/${profile.id}/follow`, { method: 'DELETE', auth: true });
        setIsFollowing(false);
      } else {
        await apiFetch(`/users/${profile.id}/follow`, { method: 'POST', auth: true });
        setIsFollowing(true);
      }
      refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update follow status');
    } finally {
      setFollowBusy(false);
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(`/users/${profile.id}/comments`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ body: commentBody }),
      });
      setCommentBody('');
      refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  }

  if (notFound) {
    return <p className="text-slate-500">No user found with username &quot;{username}&quot;.</p>;
  }

  if (!profile) {
    return <p className="text-slate-500">Loading…</p>;
  }

  const isOwnProfile = viewer?.username === profile.username;

  return (
    <div>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: profile.username }]} />

      {error && (
        <p className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">{error}</p>
      )}

      <div className="mb-4 flex items-start gap-4 rounded border border-slate-300 bg-white p-4">
        <Avatar username={profile.username} size={20} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-800">{profile.username}</h1>
            <RoleBadges roles={profile.roles} />
          </div>
          <div className="text-sm text-slate-500">{profile.rankTitle}</div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
            <span>{profile.postCount} posts</span>
            <span>{profile.threadCount} threads</span>
            <span>{profile.followerCount} followers</span>
            <span>{profile.followingCount} following</span>
            <span>Joined {formatDateTime(profile.joinedAt)}</span>
          </div>
        </div>
        {viewer && !isOwnProfile && (
          <button
            onClick={toggleFollow}
            disabled={followBusy}
            className={`rounded px-4 py-2 text-sm font-medium disabled:opacity-50 ${
              isFollowing
                ? 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                : 'bg-sky-600 text-white hover:bg-sky-500'
            }`}
          >
            {isFollowing ? 'Unfollow' : 'Follow'}
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded border border-slate-300 bg-white">
        <div className="bg-slate-600 px-4 py-2 text-sm font-semibold text-white">
          Profile comments
        </div>
        <div className="divide-y divide-slate-200">
          {comments?.items.map((comment) => (
            <div key={comment.id} className="px-4 py-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{comment.author.username}</span>
                <span>{formatDateTime(comment.createdAt)}</span>
              </div>
              <p className="mt-1 text-sm text-slate-800">{comment.body}</p>
            </div>
          ))}
          {comments?.items.length === 0 && (
            <div className="px-4 py-3 text-slate-500">No comments yet.</div>
          )}
          {!comments && <div className="px-4 py-3 text-slate-500">Loading…</div>}
        </div>
      </div>

      {viewer ? (
        <form
          onSubmit={handleComment}
          className="mt-4 space-y-3 rounded border border-slate-300 bg-white p-4"
        >
          <h2 className="font-semibold text-slate-800">Leave a comment</h2>
          <textarea
            className="w-full rounded border border-slate-300 px-3 py-2"
            rows={3}
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-sky-600 px-4 py-2 text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {submitting ? 'Posting…' : 'Post comment'}
          </button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-slate-500">Log in to leave a comment.</p>
      )}
    </div>
  );
}
