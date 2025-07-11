using MediatR;
using ChatBot.Application.Common.Models;
using ChatBot.Database;
using Microsoft.EntityFrameworkCore;

namespace ChatBot.Application.Features.Conversations.Commands
{
    public class UpdateConversationTitleCommand : IRequest<ConversationResponse>
    {
        public Guid ConversationId { get; set; }
        public string Title { get; set; } = string.Empty;
    }

    public class UpdateConversationTitleCommandHandler : IRequestHandler<UpdateConversationTitleCommand, ConversationResponse>
    {
        private readonly ChatBotDbContext _context;

        public UpdateConversationTitleCommandHandler(ChatBotDbContext context)
        {
            _context = context;
        }

        public async Task<ConversationResponse> Handle(UpdateConversationTitleCommand request, CancellationToken cancellationToken)
        {
            var conversation = await _context.Conversations
                .FindAsync(request.ConversationId, cancellationToken)
                ?? throw new InvalidOperationException("Conversation not found");

            conversation.Title = request.Title;
            conversation.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            return new ConversationResponse
            {
                Id = conversation.Id,
                Title = conversation.Title,
                CreatedAt = conversation.CreatedAt,
                UpdatedAt = conversation.UpdatedAt,
                MessageCount = conversation.MessageCount,
                LastMessage = conversation.LastMessage
            };
        }
    }
}
