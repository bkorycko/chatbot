
using ChatBot.Database.Models;

namespace ChatBot.Application.Common.Models
{
    public class ConversationListItem
    {
        public required Guid Id { get; set; }
        public required string Title { get; set; }
        public required DateTime CreatedAt { get; set; }
        public required DateTime UpdatedAt { get; set; }
        public required int MessageCount { get; set; }
        public required string? LastMessage { get; set; }
    }

    public class ConversationListResponse
    {
        public required List<ConversationListItem> Conversations { get; set; }
        public required int Total { get; set; }
    }

    public class ConversationResponse
    {
        public required Guid Id { get; set; }
        public required string Title { get; set; }
        public required DateTime CreatedAt { get; set; }
        public required DateTime UpdatedAt { get; set; }
        public required int MessageCount { get; set; }
        public required string? LastMessage { get; set; }
    }

    public class MessageDto
    {
        public required Guid Id { get; set; }
        public required string Content { get; set; }
        public required bool IsUser { get; set; }
        public required DateTime Timestamp { get; set; }
        public required RatingEnum Rating { get; set; }
        public required Guid ConversationId { get; set; }
    }

    public class ConversationMessagesResponse
    {
        public required List<MessageDto> Messages { get; set; }
        public required Guid ConversationId { get; set; }
        public required string ConversationTitle { get; set; }
    }

    public class UpdateConversationTitleRequest
    {
        public required string Title { get; set; }
    }
}
