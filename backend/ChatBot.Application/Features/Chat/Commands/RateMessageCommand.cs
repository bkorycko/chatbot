using MediatR;
using ChatBot.Application.Common.Models;
using ChatBot.Database;
using ChatBot.Database.Models;

namespace ChatBot.Application.Features.Chat.Commands
{
    public class RateMessageCommand : IRequest<RateMessageResponse>
    {
        public Guid MessageId { get; set; }
        public RatingEnum Rating { get; set; }
    }

    public class RateMessageCommandHandler : IRequestHandler<RateMessageCommand, RateMessageResponse>
    {
        private readonly ChatBotDbContext  _context;

        public RateMessageCommandHandler(ChatBotDbContext context)
        {
            _context = context;
        }

        public async Task<RateMessageResponse> Handle(RateMessageCommand request, CancellationToken cancellationToken)
        {
            var msg = await _context.Messages.FindAsync(request.MessageId, cancellationToken)
                ?? throw new InvalidOperationException("Message not found");

            msg.Rating = request.Rating;

            await _context.SaveChangesAsync(cancellationToken);

            return new RateMessageResponse 
            { 
                Success = true, 
                MessageId = msg.Id, 
                Rating = msg.Rating 
            };
        }
    }
}
