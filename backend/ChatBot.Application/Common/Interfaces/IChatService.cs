using ChatBot.Application.Common.Models;

namespace ChatBot.Application.Common.Interfaces
{
    public interface IChatService
    {
        IAsyncEnumerable<StreamMessageChunk> GenerateResponseAsync(string message, Guid? conversationId = null, CancellationToken cancellationToken = default);
    }
}
