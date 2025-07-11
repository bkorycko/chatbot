using MediatR;
using ChatBot.Application.Common.Models;
using ChatBot.Database;
using ChatBot.Database.Models;

namespace ChatBot.Application.Features.Conversations.Commands
{
    public class CreateConversationCommand : IRequest<ConversationResponse>
    {
        public string? Title { get; set; }
    }

    public class CreateConversationCommandHandler : IRequestHandler<CreateConversationCommand, ConversationResponse>
    {
        private readonly ChatBotDbContext  _context;

        public CreateConversationCommandHandler(ChatBotDbContext context)
        {
            _context = context;
        }

        public async Task<ConversationResponse> Handle(CreateConversationCommand request, CancellationToken cancellationToken)
        {
            var conversation = new Conversation
            {
                Id = Guid.NewGuid(),
                Title = request.Title ?? "Nowa konwersacja",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                MessageCount = 0
            };

            _context.Conversations.Add(conversation);
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
