FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copier le fichier projet et restaurer les dépendances
COPY RetroRacer.csproj .
RUN dotnet restore

# Copier tout le code et publier
COPY . .
RUN dotnet publish -c Release -o /app

# Image finale légère
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app

# Créer un dossier pour la base de données persistante
RUN mkdir -p /app/data

COPY --from=build /app .

# Port exposé
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ConnectionStrings__DefaultConnection="Data Source=/app/data/RetroRacer.db"

ENTRYPOINT ["dotnet", "RetroRacer.dll"]
