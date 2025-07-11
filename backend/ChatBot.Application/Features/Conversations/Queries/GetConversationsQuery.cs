using MediatR;
using ChatBot.Application.Common.Models;
using ChatBot.Database;
using Microsoft.EntityFrameworkCore;

namespace ChatBot.Application.Features.Conversations.Queries
{
    public class GetConversationsQuery : IRequest<ConversationListResponse>
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    public class GetConversationsQueryHandler : IRequestHandler<GetConversationsQuery, ConversationListResponse>
    {
        private readonly ChatBotDbContext  _context;

        public GetConversationsQueryHandler(ChatBotDbContext context)
        {
            _context = context;
        }

        public async Task<ConversationListResponse> Handle(GetConversationsQuery request, CancellationToken cancellationToken)
        {
            var skip = (request.Page - 1) * request.PageSize;

            var conversations = await _context.Conversations
                .OrderByDescending(c => c.UpdatedAt)
                .Skip(skip)
                .Take(request.PageSize)
                .Select(c => new ConversationListItem
                {
                    Id = c.Id,
                    Title = c.Title,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt,
                    MessageCount = c.MessageCount,
                    LastMessage = c.LastMessage
                })
                .ToListAsync(cancellationToken);

            var total = await _context.Conversations.CountAsync(cancellationToken);

            return new ConversationListResponse
            {
                Conversations = conversations,
                Total = total
            };
        }
    }
}
