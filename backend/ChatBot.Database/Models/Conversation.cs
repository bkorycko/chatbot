
namespace ChatBot.Database.Models
{
    public class Conversation
    {
        public Guid Id { get; set; }
        public required string Title { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int MessageCount { get; set; }
        public string? LastMessage { get; set; }
        public ICollection<Message> Messages { get; set; } = [];
    }
}
