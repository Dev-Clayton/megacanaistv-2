# Megacanaistv

Implement exactly the screenshot and nothing else

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://megacanaistv-2.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b5a91e38-3cdb-4ad6-8197-cc2ec2a4bfe4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```


## Catálogo de filmes e séries

- `/filmes`: lê os IDs de filmes de `https://redeflixapi.store/list-movie-ids.txt`.
- `/series`: oferece Séries, Animes e Doramas com as listas JSON da RedeFlixApi.
- `/filme/:id` e `/serie/:id`: páginas de detalhes com o componente de player usado pelos canais.
- As informações de título, sinopse, ano, avaliação e pôster são enriquecidas pela API do TMDB em português do Brasil.
- O catálogo aceita `TMDB_API_KEY` (chave de API) ou `TMDB_ACCESS_TOKEN` (Read Access Token Bearer).
- Sem credenciais TMDB, as páginas continuam funcionando com os IDs e metadados que vierem nas listas da RedeFlixApi, mas filmes podem aparecer somente como “Filme + ID”.
- Os players de filmes e episódios usam o mesmo componente de player das páginas de canais, com controles de recarregar, ampliar e liberar acesso.

Configure uma destas variáveis como secret do servidor (não use prefixo `VITE_`, para não expor credenciais no navegador). Para desenvolvimento local, crie um arquivo `.env`:

```env
TMDB_API_KEY=sua_chave_de_api_tmdb
# Alternativamente, use o Read Access Token do TMDB:
TMDB_ACCESS_TOKEN=seu_read_access_token
```

A integração usa os endpoints de filmes e séries do TMDB em português do Brasil. Consulte os termos de uso e inclua a atribuição exigida pelo TMDB na versão publicada.
