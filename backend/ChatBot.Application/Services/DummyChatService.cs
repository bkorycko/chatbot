using ChatBot.Application.Common.Interfaces;
using ChatBot.Application.Common.Models;
using System.Runtime.CompilerServices;

namespace ChatBot.Application.Services
{
    public class DummyChatService : IChatService
    {
        private static readonly string[] DummyResponses =
        [
            "Lorem ipsum dolor sit amet.",
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae vestibulum.",
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae vestibulum vestibulum. Cras venenatis euismod malesuada. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas."
        ];

        public async IAsyncEnumerable<StreamMessageChunk> GenerateResponseAsync(
            string message, 
            Guid? conversationId = null, 
            [EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            yield return new StreamMessageChunk
            {
                Type = "start",
                Content = "",
                ConversationId = conversationId,
                Timestamp = DateTime.UtcNow
            };

            var random = new Random();
            var response = DummyResponses[random.Next(DummyResponses.Length)];

            var words = response.Split(' ');

            foreach (var word in words)
            {
                if (cancellationToken.IsCancellationRequested)
                    yield break;

                yield return new StreamMessageChunk
                {
                    Type = "chunk",
                    Content = word,
                    ConversationId = conversationId,
                    Timestamp = DateTime.UtcNow
                };

                await Task.Delay(random.Next(100, 500), cancellationToken);
            }

            yield return new StreamMessageChunk
            {
                Type = "complete",
                Content = "",
                ConversationId = conversationId,
                Timestamp = DateTime.UtcNow
            };
        }
    }
}
