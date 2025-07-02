import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Send } from 'lucide-react';

import type { Comment } from "@/types/comment";
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';

interface CommentSectionProps {
  comments: Comment[];
  onAddComment: (text: string) => Promise<void>;
  isSubmitting?: boolean;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  comments,
  onAddComment,
  isSubmitting = false
}) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    
    await onAddComment(newComment);
    setNewComment('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
          Comments & Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing Comments */}
        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <Avatar className="h-10 w-10">
                  {comment.user.avatar ? (
                    <AvatarImage src={comment.user.avatar} alt={comment.user.name ?? "?"} />
                  ) : null}
                  <AvatarFallback>
                    {comment.user.initials || (comment.user.name ? comment.user.name.charAt(0) : "?")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium ">{comment.user.name ?? "?"}</h4>
                    <span className="text-sm ">{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className=" leading-relaxed whitespace-pre-wrap">
                    {comment.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12  mx-auto mb-3" />
            <p className="text-gray-500">No comments yet. Be the first to add one!</p>
          </div>
        )}

        {/* Add New Comment */}
        <div className="border-t pt-6">
          <h4 className="font-medium mb-3">Add a comment</h4>
          <div className="space-y-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Type your comment here..."
              rows={3}
              disabled={isSubmitting}
            />
            <Button 
              onClick={handleSubmit}
              disabled={!newComment.trim() || isSubmitting}
              
           
            >
              Add Comment
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};