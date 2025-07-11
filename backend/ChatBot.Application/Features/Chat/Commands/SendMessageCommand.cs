using ChatBot.Application.Common.Interfaces;
using ChatBot.Application.Common.Models;
using ChatBot.Database;
using ChatBot.Database.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Runtime.CompilerServices;

namespace ChatBot.Application.Features.Chat.Commands
{
    public class SendMessageCommand : IRequest<IAsyncEnumerable<StreamMessageChunk>>
    {
        public string Message { get; set; } = string.Empty;
        public Guid? ConversationId { get; set; }
        public Func<IServiceProvider, Task>? OnCompleted { get; set; }
    }

    public class SendMessageCommandHandler : IRequestHandler<SendMessageCommand, IAsyncEnumerable<StreamMessageChunk>>
    {
        private readonly ChatBotDbContext  _context;
        private readonly IChatService _chatService;

        public SendMessageCommandHandler(ChatBotDbContext context, IChatService chatService)
        {
            _context = context;
            _chatService = chatService;
        }

        public Task<IAsyncEnumerable<StreamMessageChunk>> Handle(SendMessageCommand request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
                throw new ArgumentException("Message is required");

            return Task.FromResult(StreamMessageAsync(request, cancellationToken));
        }

        private async IAsyncEnumerable<StreamMessageChunk> StreamMessageAsync(SendMessageCommand request, [EnumeratorCancellation] CancellationToken cancellationToken)
        {
            Conversation? conversation = null;
            
            if (request.ConversationId.HasValue)
            {
                conversation = await _context.Conversations
                    .Include(c => c.Messages)
                    .FirstOrDefaultAsync(c => c.Id == request.ConversationId.Value, cancellationToken)
                    ?? throw new InvalidOperationException("Conversation not found");
            }
            else
            {
                conversation = new Conversation
                {
                    Id = Guid.NewGuid(),
                    Title = request.Message.Length > 32 ? request.Message[..32] : request.Message,
                    CreatedAt = DateTime.UtcNow,
                };

                _context.Conversations.Add(conversation);
            }

            var userMsg = new Message
            {
                Id = Guid.NewGuid(),
                Content = request.Message,
                IsUser = true,
                Timestamp = DateTime.UtcNow,
                Conversation = conversation
            };

            _context.Messages.Add(userMsg);
            
            conversation.UpdatedAt = DateTime.UtcNow;
            conversation.MessageCount++;
            conversation.LastMessage = request.Message;

            var aiMsg = new Message
            {
                Id = Guid.NewGuid(),
                Content = "",
                IsUser = false,
                Timestamp = DateTime.UtcNow,
                Conversation = conversation,
            };

            _context.Messages.Add(aiMsg);

            await _context.SaveChangesAsync(cancellationToken);

            var aiResponse = "";

            request.OnCompleted = async sp =>
            {
                await UpdateMessageConversation(aiMsg.Id, aiResponse, conversation.Id, sp);
            };

            await foreach (var chunk in _chatService.GenerateResponseAsync(request.Message, conversation.Id, cancellationToken))
            {
                if (chunk.Type == "chunk")
                {
                    aiResponse += (aiResponse.Length > 0 ? " " : "") + chunk.Content;
                }

                yield return new StreamMessageChunk
                {
                    Type = chunk.Type,
                    Content = chunk.Content,
                    MessageId = aiMsg.Id,
                    ConversationId = conversation.Id,
                    Timestamp = chunk.Timestamp
                };
            }
        }

        private async Task UpdateMessageConversation(Guid messageId, string content, Guid conversationId, IServiceProvider sp)
        {
            using var scope = sp.CreateScope();

            var context = scope.ServiceProvider.GetRequiredService<ChatBotDbContext>();

            var conversation = await context.Conversations
                .Include(c => c.Messages)
                .FirstOrDefaultAsync(c => c.Id == conversationId)
                ?? throw new InvalidOperationException("Conversation not found");

            var aiMsg = conversation.Messages.FirstOrDefault(m => m.Id == messageId)
                ?? throw new InvalidOperationException("Message not found");

            if (aiMsg.IsUser)
                throw new InvalidOperationException("Cannot update a user message");

            aiMsg.Content = content;

            conversation.UpdatedAt = DateTime.UtcNow;
            conversation.MessageCount++;
            conversation.LastMessage = aiMsg.Content;

            await context.SaveChangesAsync();
        }
    }
}
