import React from 'react';
import { Star, MessageCircle } from 'lucide-react';
import ReviewCard from '@/features/reviews/components/ReviewCard';
import ReviewForm from '@/features/reviews/components/ReviewForm';
import * as reviewService from '@/services/review-service';

import { User as FirebaseUser } from 'firebase/auth';
import { UserProfile } from '@/types';

interface ListingReviewsProps {
  listingId: string;
  rating: number;
  reviewsCount: number;
  reviews: (reviewService.Review & { id: string })[];
  loadingReviews: boolean;
  activeReviewSession: reviewService.ReviewSession | null;
  setActiveReviewSession: (session: reviewService.ReviewSession | null) => void;
  user: FirebaseUser | null;
  profileData: UserProfile | null;
  onReviewSubmitted: () => void;
}

export const ListingReviews: React.FC<ListingReviewsProps> = ({
  listingId,
  rating,
  reviewsCount,
  reviews,
  loadingReviews,
  activeReviewSession,
  setActiveReviewSession,
  user,
  profileData,
  onReviewSubmitted,
}) => {
  return (
    <div className="space-y-10 border-t border-gray-100 pt-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h3 className="text-brand-navy flex items-center text-2xl font-black">
          <span className="bg-brand-navy text-brand-500 mr-3 flex h-8 w-8 items-center justify-center rounded-lg text-sm">
            05
          </span>
          Reseñas Verificadas
        </h3>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-4 py-2">
            <Star className="text-brand-500 fill-brand-500 h-4 w-4" />
            <span className="text-sm font-black text-brand-navy">{rating}</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            {reviews.length || reviewsCount} Reseñas Totales
          </span>
        </div>
      </div>

      {activeReviewSession && (
        <ReviewForm
          listingId={listingId}
          guestId={user?.uid || ''}
          guestName={profileData?.displayName || 'Huésped'}
          reviewSessionId={activeReviewSession.id}
          onSuccess={() => {
            setActiveReviewSession(null);
            onReviewSubmitted();
          }}
        />
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {loadingReviews ? (
          [...Array(2)].map((_, i) => (
            <div key={i} className="h-48 w-full animate-pulse rounded-3xl bg-gray-50" />
          ))
        ) : reviews.length > 0 ? (
          reviews.map((review) => (
            <ReviewCard
              key={review.id}
              guestName={review.guestName}
              rating={review.rating}
              comment={review.comment}
              createdAt={review.createdAt}
            />
          ))
        ) : (
          <div className="col-span-full rounded-3xl border-2 border-dashed border-gray-100 p-12 text-center">
            <MessageCircle className="mx-auto mb-4 h-12 w-12 text-gray-200" />
            <p className="text-sm font-bold text-gray-400">
              Aún no hay reseñas verificadas para esta propiedad.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingReviews;
