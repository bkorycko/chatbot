using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;
using MediatR;
using ChatBot.Application.Features.Chat.Commands;
using ChatBot.Application.Common.Models;

namespace ChatBot.Web.Controllers
{
    [ApiController]
    [Route("api/chat")]
    public class ChatController : ControllerBase
    {
        private readonly IMediator _mediator;
        
        public ChatController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost("send")]
        public async Task Send([FromBody] SendMessageCommand command, CancellationToken cancellationToken)
        {
            Response.Headers["Content-Type"] = "text/event-stream";
            Response.Headers["Cache-Control"] = "no-cache";
            Response.Headers["Connection"] = "keep-alive";

            var streamResult = await _mediator.Send(command);

            await foreach (var chunk in streamResult)
            {
                if (cancellationToken.IsCancellationRequested)
                    break;

                await SendEvent(chunk.Type, chunk);
                await Response.Body.FlushAsync();
            
                if (chunk.Type == "complete" || chunk.Type == "error")
                    break;
            }
            
            command.OnCompleted?.Invoke(HttpContext.RequestServices);

        }

        [HttpPost("rate")]
        public async Task<ActionResult<RateMessageResponse>> Rate([FromBody] RateMessageCommand command)
        {
            var response = await _mediator.Send(command);
            return Ok(response);
        }

        private async Task SendEvent(string eventType, object data)
        {
            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                DictionaryKeyPolicy = JsonNamingPolicy.CamelCase
            };
            var json = JsonSerializer.Serialize(data, options);
            var eventData = $"event: {eventType}\ndata: {json}\n\n";
            var bytes = Encoding.UTF8.GetBytes(eventData);
            await Response.Body.WriteAsync(bytes, 0, bytes.Length);
            await Response.Body.FlushAsync();
        }
    }
}
