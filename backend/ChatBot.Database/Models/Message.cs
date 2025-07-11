using System;

namespace ChatBot.Database.Models
{
    public class Message
    {
        public Guid Id { get; set; }
        public required string Content { get; set; }
        public bool IsUser { get; set; }
        public DateTime Timestamp { get; set; }
        public RatingEnum Rating { get; set; } = RatingEnum.None;
        public Guid ConversationId { get; set; }
        public Conversation Conversation { get; set; } = null!;
    }
}
