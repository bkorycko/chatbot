FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["ChatBot.Web/ChatBot.Web.csproj", "ChatBot.Web/"]
COPY ["ChatBot.Application/ChatBot.Application.csproj", "ChatBot.Application/"]
COPY ["ChatBot.Database/ChatBot.Database.csproj", "ChatBot.Database/"]
RUN dotnet restore "ChatBot.Web/ChatBot.Web.csproj"

COPY . .
WORKDIR "/src/ChatBot.Web"
RUN dotnet build "ChatBot.Web.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "ChatBot.Web.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

EXPOSE 5000

ENTRYPOINT ["dotnet", "ChatBot.Web.dll"]
