using ChatBot.Application.Common.Interfaces;
using ChatBot.Application.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ChatBot.Application
{
    public static class ApplicationServiceRegistration
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
        {
            return services
                .AddMediatR(cfg =>
                {
                    cfg.RegisterServicesFromAssembly(typeof(ApplicationServiceRegistration).Assembly);
                    cfg.LicenseKey = configuration["MediatR:LicenseKey"];
                })
                .AddScoped<IChatService, DummyChatService>();
        }
    }
}
