using MediatR;
using ChatBot.Application.Common.Models;
using ChatBot.Database;
using Microsoft.EntityFrameworkCore;

namespace ChatBot.Application.Features.Conversations.Queries
{
    public class GetConversationMessagesQuery : IRequest<ConversationMessagesResponse>
    {
        public Guid ConversationId { get; set; }
    }

    public class GetConversationMessagesQueryHandler : IRequestHandler<GetConversationMessagesQuery, ConversationMessagesResponse>
    {
        private readonly ChatBotDbContext  _context;

        public GetConversationMessagesQueryHandler(ChatBotDbContext context)
        {
            _context = context;
        }

        public async Task<ConversationMessagesResponse> Handle(GetConversationMessagesQuery request, CancellationToken cancellationToken)
        {
            var conversation = await _context.Conversations
                .Include(c => c.Messages)
                .FirstOrDefaultAsync(c => c.Id == request.ConversationId, cancellationToken)
                ?? throw new InvalidOperationException("Conversation not found");

            var messages = conversation.Messages
                .OrderBy(m => m.Timestamp)
                .Select(m => new MessageDto
                {
                    Id = m.Id,
                    Content = m.Content,
                    IsUser = m.IsUser,
                    Timestamp = m.Timestamp,
                    Rating = m.Rating,
                    ConversationId = m.Conversation.Id
                })
                .ToList();

            return new ConversationMessagesResponse
            {
                Messages = messages,
                ConversationId = conversation.Id,
                ConversationTitle = conversation.Title
            };
        }
    }
}
