using MediatR;
using ChatBot.Database;

namespace ChatBot.Application.Features.Conversations.Commands
{
    public class DeleteConversationCommand : IRequest<bool>
    {
        public Guid ConversationId { get; set; }
    }

    public class DeleteConversationCommandHandler : IRequestHandler<DeleteConversationCommand, bool>
    {
        private readonly ChatBotDbContext  _context;

        public DeleteConversationCommandHandler(ChatBotDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(DeleteConversationCommand request, CancellationToken cancellationToken)
        {
            var conversation = await _context.Conversations
                .FindAsync(request.ConversationId);

            if (conversation == null)
                return false;

            _context.Conversations.Remove(conversation);
            await _context.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}
