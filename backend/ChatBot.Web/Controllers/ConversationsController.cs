using Microsoft.AspNetCore.Mvc;
using MediatR;
using ChatBot.Application.Features.Conversations.Commands;
using ChatBot.Application.Features.Conversations.Queries;
using ChatBot.Application.Common.Models;

namespace ChatBot.Web.Controllers
{
    [ApiController]
    [Route("api/conversations")]
    public class ConversationsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ConversationsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult<ConversationListResponse>> GetConversations([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var query = new GetConversationsQuery
            {
                Page = page,
                PageSize = pageSize
            };

            var response = await _mediator.Send(query);
            return Ok(response);
        }

        [HttpGet("{conversationId}/messages")]
        public async Task<ActionResult<ConversationMessagesResponse>> GetMessages(Guid conversationId)
        {
            var query = new GetConversationMessagesQuery
            {
                ConversationId = conversationId
            };

            var response = await _mediator.Send(query);
            return Ok(response);
        }

        [HttpPost]
        public async Task<ActionResult<ConversationResponse>> CreateConversation([FromBody] CreateConversationCommand command)
        {
            var response = await _mediator.Send(command);
            return Ok(response);
        }

        [HttpDelete("{conversationId}")]
        public async Task<ActionResult<object>> DeleteConversation(Guid conversationId)
        {
            var command = new DeleteConversationCommand
            {
                ConversationId = conversationId
            };

            var success = await _mediator.Send(command);
            if (!success)
            {
                return NotFound(new { message = "Conversation not found", code = "NOT_FOUND" });
            }

            return Ok(new { success = true });
        }

        [HttpPatch("{conversationId}")]
        public async Task<ActionResult<ConversationResponse>> UpdateConversationTitle(Guid conversationId, [FromBody] UpdateConversationTitleRequest request)
        {
            var command = new UpdateConversationTitleCommand
            {
                ConversationId = conversationId,
                Title = request.Title
            };

            var response = await _mediator.Send(command);
            return Ok(response);
        }
    }
}
