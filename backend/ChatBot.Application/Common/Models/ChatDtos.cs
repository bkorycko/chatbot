
using ChatBot.Database.Models;

namespace ChatBot.Application.Common.Models
{
    public class StreamMessageChunk
    {
        public required string Type { get; set; }
        public required string Content { get; set; }
        public Guid? MessageId { get; set; }
        public Guid? ConversationId { get; set; }
        public DateTime? Timestamp { get; set; }
    }

    public class RateMessageResponse
    {
        public bool Success { get; set; }
        public Guid MessageId { get; set; }
        public RatingEnum Rating { get; set; }
    }
}
